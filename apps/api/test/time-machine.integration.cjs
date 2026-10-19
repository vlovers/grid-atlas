const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

// Disposable owned schema, never the developer's real archive.
const originalUrl = process.env.DATABASE_URL;
assert.ok(originalUrl, 'DATABASE_URL required');
const schema = 'time_machine_test_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: originalUrl });
let db, app, base;
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
  await db.query(readFileSync(resolve(__dirname, 'fixtures.sql'), 'utf8'));
  // Add a second, independent synthetic race to demonstrate a season delta.
  await db.query(`
    INSERT INTO external_identities(source_id,entity_kind,external_id)
      VALUES(1,'race','time-machine-second-race');
    INSERT INTO historical_races(external_identity_id,season_year,round,official_name,circuit_id,race_date)
      SELECT id,1951,1,'Synthetic second race',1,'1951-05-01'
      FROM external_identities WHERE entity_kind='race' AND external_id='time-machine-second-race';
    INSERT INTO historical_race_results(race_id,driver_id,constructor_id,
      position_display_order,position_number,position_text,driver_number,points,shared_car)
      VALUES(2,1,2,1,2,'2','1',3,false),
            (2,2,1,2,1,'1','2',9,false);
  `);
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

async function request(path) {
  const response = await fetch(`${base}/api/explorer/${path}`);
  return { status: response.status, body: await response.json() };
}
const compare = (kind, id = 1, from = 1950, to = 1951) =>
  request(`${kind}/${id}/compare?fromYear=${from}&toYear=${to}`);

test('driver diff classifies observed changes with per-year counts, not contracts', async () => {
  const { status, body } = await compare('drivers');
  assert.equal(status, 200);
  const data = body.data;
  assert.deepEqual([data.from_year, data.to_year], [1950, 1951]);
  assert.deepEqual(data.focus, { entity_type: 'driver', entity_id: '1', name: 'driver-a' });
  assert.deepEqual(data.added.map(x => x.entity_id), ['2']);
  assert.deepEqual(data.removed.map(x => x.entity_id), ['1']);
  assert.deepEqual(data.unchanged, []);
  assert.deepEqual(data.removed[0].from, {
    result_entries: 1, races: 1, winning_races: 1,
  });
  assert.equal(data.removed[0].to, null);
  assert.equal(data.added[0].from, null);
  assert.deepEqual(data.added[0].to, {
    result_entries: 1, races: 1, winning_races: 0,
  });
  assert.equal(data.provenance, 'imported-main-race-results');
  assert.ok(data.limitations.includes('absence_of_record_not_proof_of_absence'));
});

test('constructor preserves distinct race count for two shared-car result rows', async () => {
  const { status, body } = await compare('constructors');
  assert.equal(status, 200);
  const data = body.data;
  assert.deepEqual(data.added, []);
  assert.deepEqual(data.removed.map(x => x.entity_id), ['1']);
  assert.deepEqual(data.unchanged.map(x => x.entity_id), ['2']);
  assert.deepEqual(data.unchanged[0].from, {
    result_entries: 1, races: 1, winning_races: 1,
  });
  assert.deepEqual(data.unchanged[0].to, {
    result_entries: 1, races: 1, winning_races: 1,
  });
  // Both synthetic drivers have result entries in one shared-car race.
  assert.equal(data.removed[0].from.races, 1);
  assert.equal(data.removed[0].to, null);
});

test('empty years preserve canonical focus without inventing associations', async () => {
  const { status, body } = await compare('drivers', 1, 2199, 2200);
  assert.equal(status, 200);
  assert.deepEqual([body.data.added, body.data.removed, body.data.unchanged], [[], [], []]);
  assert.equal(body.data.focus.entity_id, '1');
});

test('query and canonical BIGINT validation rejects malformed inputs', async () => {
  const invalid = [
    'drivers/0/compare?fromYear=1950&toYear=1951',
    'drivers/9223372036854775808/compare?fromYear=1950&toYear=1951',
    'drivers/abc/compare?fromYear=1950&toYear=1951',
    'drivers/1/compare?fromYear=1950&toYear=1950',
    'drivers/1/compare?fromYear=1949&toYear=1951',
    'drivers/1/compare?fromYear=1950&toYear=2201',
    'drivers/1/compare?fromYear=x&toYear=1951',
    'drivers/1/compare?fromYear=1950',
    'drivers/1/compare?fromYear=1950&fromYear=1951&toYear=1951',
    'constructors/1/compare?fromYear=1950&toYear=1950',
  ];
  for (const path of invalid) {
    const response = await request(path);
    assert.equal(response.status, 400, path);
  }
  for (const kind of ['drivers', 'constructors']) {
    assert.equal((await compare(kind, 999999)).status, 404);
  }
});

test('comparison rejects >500 distinct neighbors instead of returning a false partial diff', async () => {
  // Synthetic pressure case in this isolated schema only. One constructor
  // association per new canonical neighbor; no source-history assertions.
  await db.query(`
    INSERT INTO external_identities(source_id,entity_kind,external_id)
      SELECT 1,'constructor','tm-extra-'||n FROM generate_series(1,501) AS n;
    INSERT INTO historical_constructors(external_identity_id,display_name)
      SELECT id, external_id FROM external_identities
      WHERE entity_kind='constructor' AND external_id LIKE 'tm-extra-%';
    INSERT INTO historical_race_results(race_id,driver_id,constructor_id,
      position_display_order,position_number,position_text,driver_number,points,shared_car)
      SELECT 2,1,c.id,row_number() OVER (ORDER BY c.id)+2,NULL,'NC','1',0,false
      FROM historical_constructors c
      JOIN external_identities x ON x.id=c.external_identity_id
      WHERE x.external_id LIKE 'tm-extra-%';
  `);
  const response = await compare('drivers');
  assert.equal(response.status, 422);
  assert.match(response.body.message, /bounded neighbor limit/);
});
