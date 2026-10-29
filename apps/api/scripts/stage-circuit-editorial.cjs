'use strict';
// Transactional staging only. Never sets verification, approval or publication.
const fs=require('node:fs');
const {articleSections}=require('./editorial-body.cjs');
const allowed=(o,keys)=>o && typeof o==='object' && !Array.isArray(o) &&
  Object.keys(o).every(k=>keys.includes(k));
const nonempty=s=>typeof s==='string' && s.trim().length>0;
const slug=s=>typeof s==='string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const iso=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
function assertResearchDraft(b) {
  if(!allowed(b,['schema_version','release_kind','publication_status','circuit_external_id',
    'locale','slug','title','body_markdown','author','claims']) ||
    b.schema_version!==1 || b.release_kind!=='circuit_research_draft' ||
    b.publication_status!=='unreviewed' || !slug(b.circuit_external_id) ||
    !['uk','en'].includes(b.locale) || !slug(b.slug) || !nonempty(b.title) ||
    !nonempty(b.body_markdown) || !nonempty(b.author))
    throw Error('invalid or potentially approved research draft');
  if(!Array.isArray(b.claims) || !b.claims.length || b.claims.length>200)
    throw Error('draft needs 1-200 unreviewed claims');
  const statements=new Set();
  for(const c of b.claims) {
    if(!allowed(c,['statement','evidence']) || !nonempty(c.statement) ||
      statements.has(c.statement.trim()) || !Array.isArray(c.evidence) ||
      !c.evidence.length || c.evidence.length>20)
      throw Error('duplicate/empty claim or missing candidate evidence');
    statements.add(c.statement.trim());
    const seen=new Set();
    for(const e of c.evidence) {
      if(!allowed(e,['source_url','title','publisher','author','accessed_on','locator']) ||
        !nonempty(e.source_url) || !nonempty(e.title) || !nonempty(e.publisher) ||
        !nonempty(e.locator) || (e.author!=null && !nonempty(e.author)) ||
        !iso(e.accessed_on)) throw Error('incomplete candidate evidence');
      let u;
      try { u=new URL(e.source_url); } catch { throw Error('invalid source URL'); }
      if(u.protocol!=='https:' || u.username || u.password || /\s/.test(e.source_url))
        throw Error('evidence requires credential-free HTTPS');
      const key=JSON.stringify([e.source_url,e.locator]);
      if(seen.has(key)) throw Error('duplicate evidence locator');
      seen.add(key);
    }
  }
  articleSections(b.body_markdown,b.claims);
  return b;
}
async function stage(client,bundle,identitySource='f1db') {
  const b=assertResearchDraft(bundle);
  if(!slug(identitySource)) throw Error('invalid trusted identity source');
  await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
  try {
    const identity=await client.query(
      "SELECT c.id::text AS id FROM historical_circuits c JOIN external_identities ei ON ei.id=c.external_identity_id JOIN data_sources ds ON ds.id=ei.source_id WHERE ei.entity_kind='circuit' AND ei.external_id=$1 AND ds.slug=$2",
      [b.circuit_external_id,identitySource]);
    if(identity.rowCount!==1) throw Error('missing/ambiguous circuit identity');
    const circuitId=identity.rows[0].id;
    const previous=await client.query(
      'SELECT id FROM circuit_editorial_articles WHERE circuit_id=$1 AND locale=$2 FOR UPDATE',
      [circuitId,b.locale]);
    if(previous.rowCount) throw Error('existing locale article: refuse overwrite');
    const article=await client.query(
      "INSERT INTO circuit_editorial_articles(circuit_id,locale,slug,title,body_markdown,author,status) VALUES($1,$2,$3,$4,$5,$6,'draft') RETURNING id::text",
      [circuitId,b.locale,b.slug,b.title,b.body_markdown,b.author]);
    const articleId=article.rows[0].id;
    for(const c of b.claims) {
      const claim=await client.query(
        "INSERT INTO circuit_editorial_claims(circuit_id,statement,status) VALUES($1,$2,'needs_review') RETURNING id::text",
        [circuitId,c.statement]);
      const claimId=claim.rows[0].id;
      for(const e of c.evidence) {
        const created=await client.query(
          'INSERT INTO content_sources(source_url,title,publisher,author,accessed_on) VALUES($1,$2,$3,$4,$5) ON CONFLICT(source_url) DO NOTHING RETURNING id::text',
          [e.source_url,e.title,e.publisher,e.author??null,e.accessed_on]);
        let sourceId=created.rows[0]?.id;
        if(!sourceId) {
          const old=await client.query(
            'SELECT id::text,title,publisher,author,accessed_on::text AS accessed_on FROM content_sources WHERE source_url=$1 FOR SHARE',
            [e.source_url]);
          if(old.rowCount!==1 || old.rows[0].title!==e.title ||
            old.rows[0].publisher!==e.publisher || old.rows[0].author!==(e.author??null) ||
            old.rows[0].accessed_on!==e.accessed_on)
            throw Error('conflicting source provenance: refuse overwrite');
          sourceId=old.rows[0].id;
        }
        // Evidence is a candidate, NOT reviewed support.
        await client.query(
          'INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports) VALUES($1,$2,$3,false)',
          [claimId,sourceId,e.locator]);
      }
      await client.query(
        'INSERT INTO circuit_editorial_article_claims(article_id,claim_id) VALUES($1,$2)',
        [articleId,claimId]);
    }
    await client.query('COMMIT');
    return {staged:true,published:false,status:'draft',article_id:articleId,
      circuit_id:circuitId,locale:b.locale,claims:b.claims.length};
  } catch(err) { await client.query('ROLLBACK'); throw err; }
}
async function main(args) {
  if(!args.length || args.length>2 || (args[1] && !['--dry-run','--stage'].includes(args[1])))
    throw Error('Usage: node stage-circuit-editorial.cjs <draft.json> [--dry-run|--stage]');
  const b=assertResearchDraft(JSON.parse(fs.readFileSync(args[0],'utf8')));
  if((args[1]??'--dry-run')==='--dry-run') {
    console.log(JSON.stringify({valid:true,staged:false,published:false,
      circuit_external_id:b.circuit_external_id,locale:b.locale,claims:b.claims.length}));
    return;
  }
  if(process.env.CIRCUIT_DRAFT_STAGE_CONFIRM!=='STAGE_UNREVIEWED_CIRCUIT_DRAFT' ||
    !process.env.DATABASE_URL) throw Error('explicit staging confirmation and DATABASE_URL required');
  const {Pool}=require('pg');
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
  try {
    const client=await pool.connect();
    try { console.log(JSON.stringify(await stage(client,b,
      process.env.CIRCUIT_IDENTITY_SOURCE_SLUG||'f1db'))); }
    finally { client.release(); }
  } finally { await pool.end(); }
}
if(require.main===module) main(process.argv.slice(2)).catch(e=>{
  console.error(e.message);process.exitCode=1;
});
module.exports={assertResearchDraft,stage};
