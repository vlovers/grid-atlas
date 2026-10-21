#!/usr/bin/env node
/** Explicit, transaction-scoped importer for already-reviewed editorial bundles.
 * Default mode is a database-free dry run. Only a human-authorized revision can publish.
 */
const fs = require('node:fs');
const { articleSections } = require('./editorial-body.cjs');

function assertBundle(bundle) {
  if (!bundle || bundle.schema_version !== 1 || bundle.release_kind !== 'approved_text_only' ||
      bundle.publication_status !== 'not_yet_published') throw Error('not an approved text-only export bundle');
  if (!['en','uk'].includes(bundle.locale)) throw Error('locale must be en/uk');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bundle.driver_external_id) ||
      bundle.slug !== bundle.driver_external_id) throw Error('invalid canonical driver identity');
  if (!/^[a-f0-9]{64}$/.test(bundle.revision_sha256)) throw Error('invalid revision digest');
  if (!bundle.title?.trim() || !bundle.body_markdown?.trim() ||
      !bundle.reviewer?.trim() || !bundle.author?.trim() ||
      bundle.reviewer.trim().toLowerCase() === bundle.author.trim().toLowerCase())
    throw Error('human editorial signoff and independent reviewer required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bundle.reviewed_on)) throw Error('invalid review date');
  if (!Array.isArray(bundle.claims) || !bundle.claims.length) throw Error('no reviewed claims');
  const claimIds = new Set();
  for (const claim of bundle.claims) {
    if (!claim.claim_id || claimIds.has(claim.claim_id) || !claim.statement?.trim() ||
        !claim.reviewer?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(claim.reviewed_on))
      throw Error('missing or duplicated reviewed claim');
    claimIds.add(claim.claim_id);
    if (!Array.isArray(claim.evidence) || !claim.evidence.length) throw Error('claim lacks supporting evidence');
    for (const source of claim.evidence) {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password ||
          !source.title?.trim() || !source.publisher?.trim() || !source.locator?.trim() ||
          !/^\d{4}-\d{2}-\d{2}$/.test(source.accessed_on)) throw Error('incomplete source provenance');
    }
  }
  articleSections(bundle.body_markdown, bundle.claims);
  return bundle;
}
async function publish(client, bundle) {
  assertBundle(bundle);
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(20261021)');
    const identity = await client.query(`
      SELECT d.id::text AS id FROM historical_drivers d
      JOIN external_identities ei ON ei.id = d.external_identity_id
      JOIN data_sources ds ON ds.id = ei.source_id
      WHERE ei.entity_kind = 'driver' AND ei.external_id = $1 AND ds.slug = 'f1db'
    `, [bundle.driver_external_id]);
    if (identity.rowCount !== 1) throw Error('driver identity missing or ambiguous; no publication');
    const driverId = identity.rows[0].id;
    const existing = await client.query(
      'SELECT id FROM content_articles WHERE subject_driver_id = $1 AND locale = $2 FOR UPDATE',
      [driverId,bundle.locale]);
    if (existing.rowCount) throw Error('existing locale article: refuse overwrite; withdraw/revise through separate reviewed workflow');

    // Enforce the source/evidence/review trigger sequence: evidence first, verification second,
    // article/claim edges third, article publication LAST.
    const claimRowIds = [];
    for (const claim of bundle.claims) {
      const c = await client.query(
        'INSERT INTO content_claims (subject_driver_id,statement,status) VALUES ($1,$2,$3) RETURNING id',
        [driverId,claim.statement,'needs_review']);
      const claimId = c.rows[0].id;
      for (const source of claim.evidence) {
        const src = await client.query(`
          INSERT INTO content_sources(source_url,title,publisher,author,accessed_on)
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (source_url) DO NOTHING RETURNING id
        `,[source.url,source.title,source.publisher,source.author ?? null,source.accessed_on]);
        let sourceId = src.rows[0]?.id;
        if (!sourceId) {
          const old = await client.query('SELECT id,title,publisher FROM content_sources WHERE source_url=$1', [source.url]);
          if (old.rowCount !== 1 || old.rows[0].title !== source.title || old.rows[0].publisher !== source.publisher)
            throw Error('conflicting metadata for a reused source');
          sourceId = old.rows[0].id;
        }
        await client.query('INSERT INTO content_claim_evidence(claim_id,source_id,locator,supports) VALUES($1,$2,$3,true)',
          [claimId,sourceId,source.locator]);
      }
      await client.query(`UPDATE content_claims SET status='verified',reviewer=$1,reviewed_at=$2,review_note=$3 WHERE id=$4`,
        [claim.reviewer,claim.reviewed_on, 'Approved bundle revision '+bundle.revision_sha256,claimId]);
      claimRowIds.push(claimId);
    }
    const article = await client.query(`
      INSERT INTO content_articles(subject_driver_id,locale,slug,title,body_markdown,status)
      VALUES($1,$2,$3,$4,$5,'draft') RETURNING id
    `,[driverId,bundle.locale,bundle.slug,bundle.title,bundle.body_markdown]);
    const articleId = article.rows[0].id;
    for(const id of claimRowIds) await client.query(
      'INSERT INTO content_article_claims(article_id,claim_id) VALUES($1,$2)',[articleId,id]);
    const published = await client.query(`
      UPDATE content_articles SET status='published',reviewer=$1,reviewed_at=$2,published_at=now()
      WHERE id=$3 RETURNING id
    `,[bundle.reviewer,bundle.reviewed_on,articleId]);
    if (published.rowCount!==1) throw Error('publication did not persist');
    await client.query('COMMIT');
    return {article_id:String(articleId),driver_id:driverId,locale:bundle.locale,revision:bundle.revision_sha256};
  } catch(error) { await client.query('ROLLBACK'); throw error; }
}
async function main(argv) {
  const file = argv[0], mode = argv[1] || '--dry-run';
  if (!file || !['--dry-run','--publish'].includes(mode)) throw Error('Usage: node publish-editorial.cjs <approved-bundle.json> [--dry-run|--publish]');
  const bundle=assertBundle(JSON.parse(fs.readFileSync(file,'utf8')));
  if(mode==='--dry-run') {
    console.log(JSON.stringify({ok:true,published:false,driver_external_id:bundle.driver_external_id,
      locale:bundle.locale,revision:bundle.revision_sha256,claims:bundle.claims.length}));
    return;
  }
  if(process.env.EDITORIAL_PUBLICATION_APPROVED_REVISION !== bundle.revision_sha256 ||
     process.env.EDITORIAL_PUBLISH_OPERATOR_CONFIRM !== 'PUBLISH_REVIEWED_CONTENT')
    throw Error('publication requires explicitly confirmed exact revision and operator authorization');
  if(!process.env.DATABASE_URL) throw Error('DATABASE_URL required');
  const {Pool}=require('pg');
  const pool=new Pool({connectionString:process.env.DATABASE_URL, max:1});
  const client=await pool.connect();
  try { console.log(JSON.stringify({published:true,...await publish(client,bundle)})); }
  finally {client.release();await pool.end();}
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={assertBundle,publish};
