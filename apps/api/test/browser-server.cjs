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
    INSERT INTO external_identities(source_id,entity_kind,external_id)
      SELECT 1,'driver','synthetic-'||lpad(n::text,3,'0') FROM generate_series(1,105) n;
    INSERT INTO historical_drivers(external_identity_id,display_name)
      SELECT id,'Synthetic Driver '||substring(external_id from 11)
      FROM external_identities WHERE external_id LIKE 'synthetic-%';
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
