const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

const originalUrl = process.env.DATABASE_URL;
const originalReadFlag = process.env.CIRCUIT_EDITORIAL_READ_ENABLED;
assert.ok(originalUrl, 'DATABASE_URL required for isolated PostgreSQL integration');
const schema = 'circuit_editorial_test_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: originalUrl });
const bodyMarkdown = '## Weekend\n\nSynthetic circuit claim.';
const bodyDigest = text => createHash('sha256').update(text, 'utf8').digest('hex');
const digest = bodyDigest(bodyMarkdown);
let db, app, base, circuitId, otherCircuitId, articleId, claimId, sourceId;

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  execFileSync('python3', ['packages/database/scripts/migrate.py'], {
    cwd: resolve(__dirname, '../../..'),
    env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` },
    stdio: 'pipe',
  });
  const scoped = new URL(originalUrl);
  scoped.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = scoped.toString();
  db = new Pool({ connectionString: scoped.toString() });
  const { rows: [source] } = await db.query(`
    INSERT INTO data_sources(slug,homepage_url,attribution)
    VALUES('synthetic-circuit-editorial','https://example.org','Synthetic test only')
    RETURNING id`);
  const { rows: identities } = await db.query(`
    INSERT INTO external_identities(source_id,entity_kind,external_id)
    VALUES($1,'circuit','fixture-circuit'),($1,'circuit','fixture-other-circuit')
    RETURNING id`, [source.id]);
  const { rows: circuits } = await db.query(`
    INSERT INTO historical_circuits(external_identity_id,display_name)
    VALUES($1,'Fixture circuit'),($2,'Other fixture circuit')
    RETURNING id::text`, [identities[0].id, identities[1].id]);
  [circuitId, otherCircuitId] = circuits.map(row => row.id);
  const { rows: [article] } = await db.query(`
    INSERT INTO circuit_editorial_articles
      (circuit_id,locale,slug,title,body_markdown,author,review_revision_sha256)
    VALUES($1,'en','fixture-circuit','Fixture circuit story',$2,'Fixture writer',$3)
    RETURNING id::text`, [circuitId, bodyMarkdown, digest]);
  articleId = article.id;
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '1';
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});

after(async () => {
  if (app) await app.close();
  if (db) await db.end();
  process.env.DATABASE_URL = originalUrl;
  if (originalReadFlag === undefined) delete process.env.CIRCUIT_EDITORIAL_READ_ENABLED;
  else process.env.CIRCUIT_EDITORIAL_READ_ENABLED = originalReadFlag;
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
});

const read = (id = circuitId, locale = 'en') =>
  fetch(`${base}/api/circuits/${id}/article?locale=${locale}`);

const publish = () => db.query(`
  UPDATE circuit_editorial_articles SET status='published',
    reviewer=session_user, reviewed_at=now(), published_at=now()
  WHERE id=$1`, [articleId]);

test('default-off read flag, invalid parameters and draft fail closed', async () => {
  assert.equal((await read()).status, 404);
  assert.equal((await read(circuitId, 'fr')).status, 400);
  assert.equal((await read('not-an-id')).status, 400);
  assert.equal((await read('99999999999999999999')).status, 400);
  assert.equal((await read('999999')).status, 404);
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '0';
  assert.equal((await read()).status, 404);
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '1';
  await assert.rejects(publish(), /circuit publication requires linked/);
});

test('claim must belong to circuit and have independent review and supporting evidence', async () => {
  const { rows: [claim] } = await db.query(`
    INSERT INTO circuit_editorial_claims(circuit_id,statement)
    VALUES($1,'Synthetic circuit claim.') RETURNING id::text`, [circuitId]);
  claimId = claim.id;
  await db.query('INSERT INTO circuit_editorial_article_claims(article_id,claim_id) VALUES($1,$2)',
    [articleId, claimId]);
  await assert.rejects(publish(), /circuit publication requires linked/);
  const { rows: [source] } = await db.query(`
    INSERT INTO content_sources(source_url,title,publisher,accessed_on)
    VALUES('https://example.org/circuit-fixture','Synthetic source','Fixture publisher',CURRENT_DATE)
    RETURNING id::text`);
  sourceId = source.id;
  await db.query(`
    INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports)
    VALUES($1,$2,'fixture paragraph 1',true)`, [claimId, sourceId]);
  await assert.rejects(publish(), /circuit publication requires linked/);
  await db.query(`
    UPDATE circuit_editorial_claims SET status='verified',
      reviewer=session_user, reviewed_at=now() WHERE id=$1`, [claimId]);
  await publish();
  const response = await read();
  assert.equal(response.status, 200);
  const body = (await response.json()).data;
  assert.equal(body.title, 'Fixture circuit story');
  assert.equal(body.body_markdown, '## Weekend\n\nSynthetic circuit claim.');
  assert.deepEqual(body.sections, [{ heading: 'Weekend', claim_ids: [claimId] }]);
  assert.equal(body.claims[0].statement, 'Synthetic circuit claim.');
  assert.equal(body.claims[0].evidence[0].locator, 'fixture paragraph 1');
  assert.equal(body.references[0].url, 'https://example.org/circuit-fixture');
  for (const key of ['reviewer','reviewed_at','author','review_method','review_revision_sha256']) {
    assert.equal(body[key], undefined, key + ' must stay private');
  }
  assert.equal(body.claims[0].reviewer, undefined);
  assert.equal((await read(circuitId, 'uk')).status, 404);
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '0';
  assert.equal((await read()).status, 404, 'operator switch blocks even approved rows');
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '1';
});

test('exact revision digest and reviewer metadata changes fail closed', async () => {
  const revisedBody = '## Revised weekend\n\nSynthetic circuit claim.';
  await db.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2',
    [revisedBody, articleId]);
  await publish();
  assert.equal((await read()).status, 404,
    'structurally valid prose with an obsolete review digest must not be served');

  await db.query('UPDATE circuit_editorial_articles SET review_revision_sha256=$1 WHERE id=$2',
    [bodyDigest(revisedBody), articleId]);
  await publish();
  assert.equal((await read()).status, 200, 'exact revision can pass after a new review fixture');

  await db.query("UPDATE circuit_editorial_articles SET reviewer='Another fixture reviewer' WHERE id=$1",
    [articleId]);
  assert.equal((await read()).status, 404, 'relabeling a published reviewer revokes publication');
  const { rows: [revoked] } = await db.query(
    'SELECT status, reviewer, reviewed_at, published_at FROM circuit_editorial_articles WHERE id=$1',
    [articleId]);
  assert.equal(revoked.status, 'draft');
  assert.equal(revoked.reviewer, null);
  assert.equal(revoked.reviewed_at, null);
  assert.equal(revoked.published_at, null);

  await db.query('UPDATE circuit_editorial_articles SET body_markdown=$1, review_revision_sha256=$2 WHERE id=$3',
    [bodyMarkdown, digest, articleId]);
  await publish();
  assert.equal((await read()).status, 200);
  await db.query("UPDATE circuit_editorial_articles SET reviewed_at=now() + interval '1 minute' WHERE id=$1",
    [articleId]);
  assert.equal((await read()).status, 404, 'review timestamp tampering revokes publication');
  await publish();
  assert.equal((await read()).status, 200);
});

test('prose edits, evidence edits and source metadata changes revoke publication', async () => {
  await db.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2',
    ['## Weekend\n\nUnreviewed sentence.', articleId]);
  assert.equal((await read()).status, 404);
  await publish();
  assert.equal((await read()).status, 404, 'API rejects prose not matching reviewed claims');
  await db.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2',
    ['## Weekend\n\nSynthetic circuit claim.', articleId]);
  await publish();
  assert.equal((await read()).status, 200);
  await db.query('UPDATE circuit_editorial_evidence SET locator=$1 WHERE claim_id=$2',
    ['updated fixture locator', claimId]);
  assert.equal((await read()).status, 404);
  await assert.rejects(publish(), /circuit publication requires linked/);
  await db.query(`UPDATE circuit_editorial_claims SET status='verified',
    reviewer=session_user,reviewed_at=now() WHERE id=$1`, [claimId]);
  await publish();
  assert.equal((await read()).status, 200);
  await db.query('UPDATE content_sources SET title=$1 WHERE id=$2',
    ['Revised synthetic source title', sourceId]);
  assert.equal((await read()).status, 404, 'source revision invalidates claim and article');
});

test('cross-circuit links and incomplete transactions roll back without leakage', async () => {
  const { rows: [otherClaim] } = await db.query(`
    INSERT INTO circuit_editorial_claims(circuit_id,statement)
    VALUES($1,'Other circuit statement.') RETURNING id::text`, [otherCircuitId]);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO circuit_editorial_articles
      (circuit_id,locale,slug,title,body_markdown)
      VALUES($1,'uk','fixture-uk','Fixture Ukrainian','Unapproved fixture')`, [circuitId]);
    await assert.rejects(client.query(
      'INSERT INTO circuit_editorial_article_claims(article_id,claim_id) VALUES($1,$2)',
      [articleId, otherClaim.id],
    ), /cross-circuit claim link rejected/);
    await client.query('ROLLBACK');
  } finally { client.release(); }
  const { rows: [count] } = await db.query(
    'SELECT count(*)::int AS n FROM circuit_editorial_articles WHERE circuit_id=$1', [circuitId]);
  assert.equal(count.n, 1, 'failed transaction leaves no partial locale article');
  assert.equal((await read(circuitId, 'uk')).status, 404);
});

test('author self-review and AI review metadata cannot be promoted to published', async () => {
  await assert.rejects(db.query(`UPDATE circuit_editorial_claims SET status='verified',
    reviewer='Fixture writer',reviewed_at=now() WHERE id=$1`, [claimId]),
    /claim reviewer must match authenticated database session/);
  await assert.rejects(publish(), /circuit publication requires linked/);
  // Explicitly withdraw the self-reviewed claim before an independent re-review.
  await db.query("UPDATE circuit_editorial_claims SET status='needs_review' WHERE id=$1", [claimId]);
  await db.query(`UPDATE circuit_editorial_claims SET status='verified',
    reviewer=session_user, reviewed_at=now() WHERE id=$1`, [claimId]);
  await db.query(`UPDATE circuit_editorial_articles SET review_method='ai' WHERE id=$1`, [articleId]);
  await assert.rejects(publish(), /check constraint|violates check constraint/i);
  assert.equal((await read()).status, 404);
  await db.query(`UPDATE circuit_editorial_articles SET review_method='human' WHERE id=$1`, [articleId]);
  await publish();
  assert.equal((await read()).status, 200);
  await db.query("UPDATE circuit_editorial_articles SET reviewer='Fixture writer' WHERE id=$1", [articleId]);
  assert.equal((await read()).status, 404, 'reviewer substitution revokes rather than relabels approval');
});

test('claim-link deletion and evidence removal revoke publication', async () => {
  await db.query('DELETE FROM circuit_editorial_article_claims WHERE article_id=$1 AND claim_id=$2',
    [articleId, claimId]);
  assert.equal((await read()).status, 404);
  await assert.rejects(publish(), /circuit publication requires linked/);
  await db.query('INSERT INTO circuit_editorial_article_claims(article_id,claim_id) VALUES($1,$2)',
    [articleId, claimId]);
  await publish();
  assert.equal((await read()).status, 200);

  await db.query('DELETE FROM circuit_editorial_evidence WHERE claim_id=$1 AND source_id=$2',
    [claimId, sourceId]);
  assert.equal((await read()).status, 404);
  await assert.rejects(publish(), /circuit publication requires linked/);
  await db.query(`INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports)
    VALUES($1,$2,'restored fixture locator',true)`, [claimId, sourceId]);
  await assert.rejects(publish(), /circuit publication requires linked/,
    'restoring evidence must not silently restore independent claim review');
  await db.query(`UPDATE circuit_editorial_claims SET status='verified',
    reviewer=session_user, reviewed_at=now() WHERE id=$1`, [claimId]);
  await publish();
  assert.equal((await read()).status, 200);
});

test('withdrawn and paused articles cannot reuse an old publication decision', async () => {
  await db.query("UPDATE circuit_editorial_articles SET status='withdrawn' WHERE id=$1", [articleId]);
  assert.equal((await read()).status, 404);
  const { rows: [withdrawn] } = await db.query(
    'SELECT status, reviewer, reviewed_at, published_at FROM circuit_editorial_articles WHERE id=$1',
    [articleId],
  );
  assert.equal(withdrawn.status, 'withdrawn');
  for (const key of ['reviewer', 'reviewed_at', 'published_at']) assert.equal(withdrawn[key], null);
  await assert.rejects(db.query(
    "UPDATE circuit_editorial_articles SET status='published' WHERE id=$1", [articleId],
  ), /fresh review transition/);
  assert.equal((await read()).status, 404);

  await publish();
  assert.equal((await read()).status, 200, 'new explicit review fixture can republish');
  await db.query("UPDATE circuit_editorial_articles SET status='in_review' WHERE id=$1", [articleId]);
  const { rows: [paused] } = await db.query(
    'SELECT reviewer, reviewed_at, published_at FROM circuit_editorial_articles WHERE id=$1', [articleId]);
  for (const key of ['reviewer', 'reviewed_at', 'published_at']) assert.equal(paused[key], null);
  await assert.rejects(db.query(
    "UPDATE circuit_editorial_articles SET status='published' WHERE id=$1", [articleId],
  ), /fresh review transition/);
  await publish();
  assert.equal((await read()).status, 200);
});

test('claim reviewer relabelling and disputed status require a new claim review', async () => {
  await db.query("UPDATE circuit_editorial_claims SET reviewer='Substituted reviewer' WHERE id=$1", [claimId]);
  const { rows: [tampered] } = await db.query(
    'SELECT status, reviewer, reviewed_at FROM circuit_editorial_claims WHERE id=$1', [claimId]);
  assert.equal(tampered.status, 'needs_review');
  assert.equal(tampered.reviewer, null);
  assert.equal(tampered.reviewed_at, null);
  assert.equal((await read()).status, 404);
  await assert.rejects(publish(), /circuit publication requires linked/);

  await db.query(`UPDATE circuit_editorial_claims SET status='verified',
    reviewer=session_user, reviewed_at=now() WHERE id=$1`, [claimId]);
  await publish();
  assert.equal((await read()).status, 200);

  await db.query("UPDATE circuit_editorial_claims SET status='disputed' WHERE id=$1", [claimId]);
  const { rows: [disputed] } = await db.query(
    'SELECT status, reviewer, reviewed_at FROM circuit_editorial_claims WHERE id=$1', [claimId]);
  assert.equal(disputed.status, 'disputed');
  assert.equal(disputed.reviewer, null);
  assert.equal(disputed.reviewed_at, null);
  await assert.rejects(db.query(
    "UPDATE circuit_editorial_claims SET status='verified' WHERE id=$1", [claimId],
  ), /fresh review transition/);
  await assert.rejects(publish(), /circuit publication requires linked/);
});


test('transactional research staging creates only drafts and unsupported evidence', async () => {
  const {stage}=require('../scripts/stage-circuit-editorial.cjs');
  const bundle={
    schema_version:1,release_kind:'circuit_research_draft',
    publication_status:'unreviewed',circuit_external_id:'fixture-circuit',
    locale:'uk',slug:'fixture-uk',title:'Unreviewed Ukrainian research',
    author:'Synthetic researcher',body_markdown:'## Research\n\nUnverified synthetic claim.',
    claims:[{statement:'Unverified synthetic claim.',evidence:[{
      source_url:'https://example.org/staged-circuit-only',
      title:'Staged synthetic source',publisher:'Fixture publisher',
      accessed_on:'2026-10-29',locator:'synthetic section 2'
    }]}]
  };
  const client=await db.connect();
  try {
    const conflict=structuredClone(bundle);
    conflict.claims[0].evidence[0].source_url='https://example.org/circuit-fixture';
    conflict.claims[0].evidence[0].title='Wrong metadata for reused URL';
    await assert.rejects(stage(client,conflict,'synthetic-circuit-editorial'),
      /conflicting source provenance/);
    const {rows:[before]}=await db.query(
      "SELECT count(*)::int AS n FROM circuit_editorial_articles WHERE circuit_id=$1 AND locale='uk'",
      [circuitId]);
    assert.equal(before.n,0,'failed staging rolls back article, claim and source writes');

    const staged=await stage(client,bundle,'synthetic-circuit-editorial');
    assert.equal(staged.published,false);
    assert.equal(staged.status,'draft');
    assert.equal(staged.claims,1);
    assert.equal((await read(circuitId,'uk')).status,404,
      'unreviewed staged manuscript must not be exposed by the public endpoint');
    const {rows:[state]}=await db.query(
      "SELECT a.status,a.reviewer,a.reviewed_at,a.published_at,a.review_revision_sha256, c.status AS claim_status,c.reviewer AS claim_reviewer,e.supports FROM circuit_editorial_articles a JOIN circuit_editorial_article_claims ac ON ac.article_id=a.id JOIN circuit_editorial_claims c ON c.id=ac.claim_id JOIN circuit_editorial_evidence e ON e.claim_id=c.id WHERE a.id=$1",
      [staged.article_id]);
    assert.equal(state.status,'draft');
    assert.equal(state.claim_status,'needs_review');
    assert.equal(state.supports,false);
    for(const key of ['reviewer','reviewed_at','published_at',
      'review_revision_sha256','claim_reviewer']) assert.equal(state[key],null,key);

    await assert.rejects(stage(client,bundle,'synthetic-circuit-editorial'),
      /existing locale article/);
    const {rows:[after]}=await db.query(
      "SELECT count(*)::int AS n FROM circuit_editorial_articles WHERE circuit_id=$1 AND locale='uk'",
      [circuitId]);
    assert.equal(after.n,1,'re-import refuses to overwrite an existing locale article');
  } finally {client.release();}
});

test('database session identity cannot be replaced by a forged reviewer label', async () => {
  await assert.rejects(db.query(`
    UPDATE circuit_editorial_claims SET status='verified',
      reviewer='Invented reviewer',reviewed_at=now() WHERE id=$1`, [claimId]),
    /claim reviewer must match authenticated database session/);
  await db.query(`UPDATE circuit_editorial_claims SET status='verified',
    reviewer=session_user,reviewed_at=now() WHERE id=$1`, [claimId]);
  await assert.rejects(db.query(`
    UPDATE circuit_editorial_articles SET status='published',
      reviewer='Invented reviewer',reviewed_at=now(),published_at=now() WHERE id=$1`,
    [articleId]), /circuit reviewer must match authenticated database session/);
  assert.equal((await read()).status, 404);
});

test('concurrent claim revocation cannot leave a publicly readable stale approval', async () => {
  const changing = await db.connect();
  const publishing = await db.connect();
  let started = false;
  try {
    await changing.query('BEGIN');
    await changing.query("UPDATE circuit_editorial_claims SET status='needs_review' WHERE id=$1",
      [claimId]);
    const attempt = publishing.query(`
      UPDATE circuit_editorial_articles SET status='published',
        reviewer=session_user,reviewed_at=now(),published_at=now() WHERE id=$1`,
      [articleId]).then(() => ({ ok: true }), error => ({ ok: false, error }));
    started = true;
    // The revocation transaction holds the article row lock through the trigger.
    await new Promise(resolve => setTimeout(resolve, 80));
    await changing.query('COMMIT');
    const result = await attempt;
    assert.equal(result.ok, false, 'publication must not pass a concurrent revocation');
    assert.match(result.error.message, /circuit publication requires linked/);
    assert.equal((await read()).status, 404);
    const { rows: [row] } = await db.query(
      'SELECT status FROM circuit_editorial_articles WHERE id=$1', [articleId]);
    assert.notEqual(row.status, 'published');
  } finally {
    if (started) await changing.query('ROLLBACK').catch(() => {});
    changing.release();
    publishing.release();
  }
});

test('untrusted PostgreSQL session cannot forge review, publication or evidence support', async (t) => {
  const { rows: [actor] } = await db.query(
    'SELECT rolsuper FROM pg_roles WHERE rolname=session_user');
  if (!actor.rolsuper) {
    t.skip('requires PostgreSQL superuser to create an isolated untrusted session');
    return;
  }
  const role = 'circuit_untrusted_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE ROLE ${role} NOLOGIN`);
  const client = await db.connect();
  try {
    await admin.query(`GRANT USAGE ON SCHEMA ${schema} TO ${role}`);
    await admin.query(`GRANT SELECT, UPDATE ON ${schema}.circuit_editorial_articles,
      ${schema}.circuit_editorial_claims,${schema}.circuit_editorial_evidence TO ${role}`);
    await db.query('UPDATE circuit_editorial_evidence SET supports=false WHERE claim_id=$1 AND source_id=$2', [claimId, sourceId]);
    await client.query(`SET SESSION AUTHORIZATION ${role}`);
    await assert.rejects(client.query(`
      UPDATE circuit_editorial_claims SET status='verified',
        reviewer=session_user,reviewed_at=now() WHERE id=$1`, [claimId]),
      /trusted circuit reviewer role required/);
    await assert.rejects(client.query(`
      UPDATE circuit_editorial_articles SET status='published',
        reviewer=session_user,reviewed_at=now(),published_at=now() WHERE id=$1`,
      [articleId]), /trusted circuit publisher role required/);
    // An untrusted worker cannot turn candidate evidence into verified support.
    await assert.rejects(client.query(`
      UPDATE circuit_editorial_evidence SET supports=true
      WHERE claim_id=$1 AND source_id=$2 AND supports=false`,
      [claimId, sourceId]), /trusted circuit reviewer role required|permission denied/);
  } finally {
    await client.query('RESET SESSION AUTHORIZATION').catch(() => {});
    client.release(true);
    await admin.query(`DROP OWNED BY ${role}`);
    await admin.query(`DROP ROLE ${role}`);
  }
});
