const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
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
const digest = 'a'.repeat(64);
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
    VALUES($1,'en','fixture-circuit','Fixture circuit story',
      '## Weekend' || E'\\n\\n' || 'Synthetic circuit claim.','Fixture writer',$2)
    RETURNING id::text`, [circuitId, digest]);
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
    reviewer='Independent fixture reviewer', reviewed_at=now(), published_at=now()
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
      reviewer='Independent fixture reviewer', reviewed_at=now() WHERE id=$1`, [claimId]);
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
    reviewer='Independent fixture reviewer',reviewed_at=now() WHERE id=$1`, [claimId]);
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

test('AI review metadata cannot be promoted to published', async () => {
  await db.query(`UPDATE circuit_editorial_articles SET review_method='ai' WHERE id=$1`, [articleId]);
  await assert.rejects(publish(), /check constraint|violates check constraint/i);
  assert.equal((await read()).status, 404);
});
