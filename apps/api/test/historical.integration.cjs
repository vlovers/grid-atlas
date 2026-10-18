const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

// Own a random schema; never truncate or change existing application data.
const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required for real PostgreSQL integration');
const schema = 'api_test_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: databaseUrl });
let app, db, base;

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  execFileSync('python3', ['packages/database/scripts/migrate.py'], {
    cwd: resolve(__dirname, '../../..'),
    env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` },
    stdio: 'pipe',
  });
  const scopedUrl = new URL(databaseUrl);
  scopedUrl.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = scopedUrl.toString();
  db = new Pool({ connectionString: scopedUrl.toString() });
  await db.query(`
    INSERT INTO data_sources(slug,homepage_url,attribution)
      VALUES ('synthetic','https://example.org','Synthetic fixtures; no historical claims');
    INSERT INTO external_identities(source_id,entity_kind,external_id)
      SELECT 1,k.kind,v.ident FROM (VALUES ('constructor'),('entrant')) k(kind)
      CROSS JOIN (VALUES ('alpha'),('beta')) v(ident);
    INSERT INTO historical_constructors(external_identity_id,display_name)
      SELECT id,external_id FROM external_identities WHERE entity_kind='constructor';
    INSERT INTO historical_entrants(external_identity_id,display_name)
      SELECT id,external_id FROM external_identities WHERE entity_kind='entrant';
    INSERT INTO external_identities(source_id,entity_kind,external_id)
      VALUES (1,'driver','driver-a'),(1,'driver','driver-b'),(1,'race','shared-car-race');
    INSERT INTO historical_drivers(external_identity_id,display_name)
      SELECT id,external_id FROM external_identities WHERE entity_kind='driver';
    INSERT INTO historical_seasons(year) VALUES (1950);
    INSERT INTO historical_races(external_identity_id,season_year,round,official_name)
      SELECT id,1950,1,'Synthetic shared-car race' FROM external_identities WHERE entity_kind='race';
    INSERT INTO historical_race_results(race_id,driver_id,constructor_id,position_display_order,
      position_number,position_text,driver_number,points,shared_car)
      VALUES (1,1,1,1,1,'1','2',4,true),(1,2,1,2,1,'1','2',4,true);
  `);
  for (const [table, subject, object] of [
    ['historical_lineage_claims', 'subject_constructor_id', 'object_constructor_id'],
    ['historical_entrant_lineage_claims', 'subject_entrant_id', 'object_entrant_id'],
  ]) {
    for (const status of ['proposed', 'verified', 'rejected']) {
      await db.query(`INSERT INTO ${table} (${subject},${object},relation_type,effective_year,
        source_url,source_title,source_publisher,evidence_note,accessed_at,review_status,reviewer,reviewed_at)
        VALUES (1,2,'renamed_to',2000,$1,$2,'Synthetic integration fixture','No historical assertion',
          CURRENT_DATE,$3,$4,$5)`,
      [`https://example.org/${table}/${status}`, `${status} fixture`, status,
        status === 'proposed' ? null : 'synthetic-test-reviewer', status === 'proposed' ? null : new Date()]);
    }
  }
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});

after(async () => {
  if (app) await app.close();
  if (db) await db.end();
  process.env.DATABASE_URL = databaseUrl;
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
});

async function get(path) {
  const response = await fetch(base + '/api/' + path);
  assert.equal(response.status, 200);
  return (await response.json()).data;
}

test('public network exposes verified constructor and entrant evidence only', async () => {
  const rows = await get('lineage/network');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.entity_type).sort(), ['constructor', 'entrant']);
  for (const row of rows) {
    assert.equal(row.source_title, 'verified fixture');
    assert.ok(row.source_url.endsWith('/verified'));
  }
});

test('both endpoint directions and entity kinds exclude nonverified claims', async () => {
  for (const kind of ['constructors', 'entrants']) {
    for (const id of [1, 2]) {
      const rows = await get(`${kind}/${id}/lineage`);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].source_title, 'verified fixture');
      assert.equal(rows[0].evidence_note, 'No historical assertion');
    }
  }
});

test('query parameters cannot opt into proposed or rejected claims', async () => {
  for (const path of ['lineage/network', 'constructors/1/lineage', 'entrants/1/lineage']) {
    for (const status of ['proposed', 'rejected']) {
      const rows = await get(`${path}?review_status=${status}&status=${status}`);
      assert.ok(rows.length > 0);
      assert.ok(rows.every(row => row.source_title === 'verified fixture'));
    }
  }
});

test('revoking a synthetic review removes the claim from every public lineage view', async () => {
  await db.query("UPDATE historical_lineage_claims SET review_status='rejected' WHERE review_status='verified'");
  await db.query("UPDATE historical_entrant_lineage_claims SET review_status='rejected' WHERE review_status='verified'");
  for (const path of ['lineage/network', 'constructors/1/lineage', 'constructors/2/lineage', 'entrants/1/lineage', 'entrants/2/lineage']) {
    assert.deepEqual(await get(path), []);
  }
});

test('shared-car winners count as one constructor win and separate driver podiums', async () => {
  const [profile] = await get('constructors/1');
  assert.equal(profile.wins, 1);
  assert.equal(profile.races, 1);
  assert.equal(profile.podium_finishes, 2);
  assert.equal(profile.driver_points, '8.00');
  const [season] = await get('constructors/1/seasons');
  assert.equal(season.wins, 1);
  assert.equal(season.podium_finishes, 2);
});
