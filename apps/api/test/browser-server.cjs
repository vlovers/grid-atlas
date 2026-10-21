// Real API + PostgreSQL for browser tests, with synthetic data in an owned schema.
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for browser integration');
const schema = 'browser_test_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: process.env.DATABASE_URL });
let app, fixture;

async function cleanup() {
  if (app) await app.close();
  if (fixture) await fixture.end();
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
}

async function main() {
  await admin.query(`CREATE SCHEMA ${schema}`);
  execFileSync('python3', ['packages/database/scripts/migrate.py'], {
    cwd: resolve(__dirname, '../../..'),
    env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` }, stdio: 'pipe',
  });
  const scoped = new URL(process.env.DATABASE_URL);
  scoped.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = scoped.toString();
  fixture = new Pool({ connectionString: scoped.toString() });
  await fixture.query(readFileSync(resolve(__dirname, 'fixtures.sql'), 'utf8'));
  await fixture.query(`
    INSERT INTO source_observations(release_id,external_identity_id,content_hash)
      SELECT 1,id,repeat('b',64) FROM external_identities
      WHERE external_id IN ('driver-a','alpha','circuit-fixture') AND entity_kind IN ('driver','constructor','circuit');
    INSERT INTO historical_identity_details(external_identity_id,release_id,source_locator,fields)
      SELECT id,1,'fixture.json#id='||external_id,
        CASE entity_kind WHEN 'driver' THEN '{"full_name":"Synthetic driver full name","permanent_number":"0","date_of_birth":"1990-01-02","nationality":"Synthetic Country"}'::jsonb
        WHEN 'constructor' THEN '{"country":"Synthetic Country"}'::jsonb
        ELSE '{"place_name":"Synthetic City","circuit_type":"STREET","country":"Synthetic Country"}'::jsonb END
      FROM external_identities WHERE external_id IN ('driver-a','alpha','circuit-fixture') AND entity_kind IN ('driver','constructor','circuit');
    INSERT INTO external_identities(source_id,entity_kind,external_id)
      SELECT 1,'driver','synthetic-'||lpad(n::text,3,'0') FROM generate_series(1,105) n;
    INSERT INTO historical_drivers(external_identity_id,display_name)
      SELECT id,'Synthetic Driver '||substring(external_id from 11)
      FROM external_identities WHERE external_id LIKE 'synthetic-%';
  `);
  // Test-only publication for an existing synthetic identity; no historical dossier is approved.
  await fixture.query(`
    INSERT INTO content_claims(subject_driver_id,statement)
      SELECT d.id,'Synthetic browser claim, not a historical assertion.' FROM historical_drivers d
      JOIN external_identities e ON e.id=d.external_identity_id WHERE e.external_id='synthetic-105';
    INSERT INTO content_sources(source_url,title,publisher,accessed_on)
      VALUES('https://example.org/browser-editorial-source','Synthetic source','Test publisher','2026-10-21');
    INSERT INTO content_claim_evidence(claim_id,source_id,locator,supports)
      SELECT c.id,s.id,'Synthetic fixture paragraph 1',true FROM content_claims c CROSS JOIN content_sources s;
    UPDATE content_claims SET status='verified',reviewer='Synthetic human test fixture',reviewed_at=now();
    INSERT INTO content_articles(subject_driver_id,locale,slug,title,body_markdown)
      SELECT subject_driver_id,'en','synthetic-approved-en','Synthetic approved fixture','## Context' || E'\\n\\n' || statement FROM content_claims;
    INSERT INTO content_article_claims(article_id,claim_id)
      SELECT a.id,c.id FROM content_articles a JOIN content_claims c ON c.subject_driver_id=a.subject_driver_id;
    UPDATE content_articles SET status='published',reviewer='Synthetic human test fixture',reviewed_at=now(),published_at=now();
    INSERT INTO content_articles(subject_driver_id,locale,slug,title,body_markdown)
      SELECT subject_driver_id,'uk','synthetic-private-uk','PRIVATE UK DRAFT SHOULD NEVER APPEAR','Private untranslated fixture' FROM content_claims;
  `);
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(3339, '127.0.0.1');
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => { cleanup().then(() => process.exit(0)).catch(() => process.exit(1)); });
  }
}

main().catch(async error => {
  console.error(error);
  await cleanup();
  process.exitCode = 1;
});
