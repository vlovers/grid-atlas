const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

const originalUrl = process.env.DATABASE_URL;
assert.ok(originalUrl, 'DATABASE_URL required');
const schema = 'editorial_test_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: originalUrl });
let app, db, base, driverId, articleId, claimId;

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  execFileSync('python3', ['packages/database/scripts/migrate.py'], {
    cwd: resolve(__dirname, '../../..'),
    env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` }, stdio: 'pipe',
  });
  const scoped = new URL(originalUrl);
  scoped.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = scoped.toString();
  db = new Pool({ connectionString: scoped.toString() });
  const { rows: [driver] } = await db.query(`WITH source AS (
    INSERT INTO data_sources(slug,homepage_url,attribution)
    VALUES('editorial-http','https://example.org','Synthetic test') RETURNING id
  ), identity AS (
    INSERT INTO external_identities(source_id,entity_kind,external_id)
    SELECT id,'driver','editorial-http-driver' FROM source RETURNING id
  )
  INSERT INTO historical_drivers(external_identity_id,display_name)
  SELECT id,'Synthetic Driver' FROM identity RETURNING id::text`);
  driverId = driver.id;
  const { rows: [article] } = await db.query(`INSERT INTO content_articles
    (subject_driver_id,locale,slug,title,body_markdown)
    VALUES($1,'en','synthetic-editorial','Synthetic biography','A test statement')
    RETURNING id::text`, [driverId]);
  articleId = article.id;
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});

after(async () => {
  if (app) await app.close();
  if (db) await db.end();
  process.env.DATABASE_URL = originalUrl;
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
});

async function read(locale = 'en') {
  return fetch(`${base}/api/drivers/${driverId}/article?locale=${locale}`);
}

test('draft, invalid locale and nonexistent driver are not publicly accessible', async () => {
  assert.equal((await read()).status, 404);
  assert.equal((await read('fr')).status, 400);
  assert.equal((await fetch(`${base}/api/drivers/not-an-id/article`)).status, 400);
  assert.equal((await fetch(`${base}/api/drivers/999999/article`)).status, 404);
});

test('published article needs a verified, supported claim and does not leak review fields', async () => {
  await db.query(`UPDATE content_articles SET status='published', reviewer='Editor',
    reviewed_at=now(), published_at=now() WHERE id=$1`, [articleId]);
  assert.equal((await read()).status, 404, 'no linked claims');
  const { rows: [claim] } = await db.query(`INSERT INTO content_claims(subject_driver_id,statement)
    VALUES($1,'Synthetic claim') RETURNING id::text`, [driverId]);
  claimId = claim.id;
  await db.query('INSERT INTO content_article_claims(article_id,claim_id) VALUES($1,$2)', [articleId,claimId]);
  assert.equal((await read()).status, 404, 'unverified claim');
  await db.query(`UPDATE content_claims SET status='verified',reviewer='Editor',
    reviewed_at=now() WHERE id=$1`, [claimId]);
  assert.equal((await read()).status, 404, 'verified claim without evidence');
  const { rows: [source] } = await db.query(`INSERT INTO content_sources
    (source_url,title,publisher,accessed_on)
    VALUES('https://example.org/editorial-evidence','Synthetic source','Example',CURRENT_DATE)
    RETURNING id::text`);
  await db.query(`INSERT INTO content_claim_evidence(claim_id,source_id,locator,supports)
    VALUES($1,$2,'paragraph 1',true)`, [claimId,source.id]);
  assert.equal((await read()).status, 404, 'evidence insertion invalidates claim review');
  await db.query(`UPDATE content_claims SET status='verified',reviewer='Editor',
    reviewed_at=now() WHERE id=$1`, [claimId]);
  await db.query(`UPDATE content_articles SET status='published',reviewer='Editor',
    reviewed_at=now(),published_at=now() WHERE id=$1`, [articleId]);
  assert.equal((await read()).status, 404, 'evidence edit resets verification');
  await db.query(`UPDATE content_claims SET status='verified',reviewer='Editor',reviewed_at=now() WHERE id=$1`, [claimId]);
  assert.equal((await read()).status, 404, 'article linkage resets publication');
  await db.query(`UPDATE content_articles SET status='published',reviewer='Editor',reviewed_at=now(),published_at=now() WHERE id=$1`, [articleId]);
  const response = await read();
  assert.equal(response.status, 200);
  const body = (await response.json()).data;
  assert.equal(body.title, 'Synthetic biography');
  assert.equal(body.body_markdown, 'A test statement');
  assert.equal(body.reviewer, undefined);
  assert.equal(body.reviewed_at, undefined);
  assert.equal((await read('uk')).status, 404);
  await db.query(`UPDATE content_claims SET status='needs_review',reviewer=NULL,reviewed_at=NULL
    WHERE id=$1`, [claimId]);
  assert.equal((await read()).status, 404, 'retracted claim blocks publication');
});
