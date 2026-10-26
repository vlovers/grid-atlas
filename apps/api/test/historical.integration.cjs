const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');
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
  await db.query(readFileSync(resolve(__dirname, 'fixtures.sql'), 'utf8'));
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

test('catalogues search names and source IDs case-insensitively with bounded pagination', async () => {
  for (const path of ['drivers', 'constructors', 'circuits']) {
    const all = await get(path);
    assert.equal(all.length, 2);
    assert.deepEqual(await get(`${path}?limit=1&offset=1`), [all[1]]);
    assert.deepEqual(await get(`${path}?q=${encodeURIComponent(all[0].name.toUpperCase())}`), [all[0]]);
    assert.deepEqual(await get(`${path}?q=${encodeURIComponent(all[0].external_id)}`), [all[0]]);
    assert.deepEqual(await get(`${path}?q=no-match`), []);
    assert.deepEqual(await get(`${path}?q=${encodeURIComponent("' OR 1=1 --")}`), []);
    for (const query of ['limit=101', 'offset=-1', `q=${'a'.repeat(101)}`, 'q=a&q=b']) {
      assert.equal((await fetch(`${base}/api/${path}?${query}`)).status, 400);
    }
  }
  assert.equal((await get('circuits?q=%25')).length, 1);
  assert.equal((await get('circuits?q=_')).length, 1);
});

test('catalogue summaries count distinct races and shared wins without inventing starts or missing titles', async () => {
  const constructors = await get('constructors');
  const team = constructors.find(row => row.id === '1');
  assert.equal(team.races, 1);
  assert.equal(team.wins, 1); // Two shared-car winner rows, one Grand Prix.
  assert.equal(team.titles, null); // No classification evidence is not zero titles.
  assert.equal(team.first_season, 1950);
  for (const driver of await get('drivers')) {
    assert.equal(driver.races, 1);
    assert.equal(driver.wins, 1);
    assert.equal(driver.titles, null);
    assert.equal(Object.hasOwn(driver, 'starts'), false);
  }
  const circuit = (await get('circuits')).find(row => row.id === '1');
  assert.equal(circuit.races, 1);
  assert.equal(circuit.first_season, 1950);
});

test('catalogue titles require final source classifications and ignore a provisional title flag', async () => {
  const hash = 'c'.repeat(64);
  try {
    await db.query('INSERT INTO historical_seasons(year) VALUES(2026) ON CONFLICT DO NOTHING');
    await db.query(`INSERT INTO historical_championship_standings
      (season_year,entity_kind,position_display_order,position_number,position_text,driver_id,points,championship_won,release_id,source_locator,content_hash)
      VALUES (2026,'driver',1,1,'1',1,1,true,1,'synthetic/provisional', $1)`, [hash]);
    assert.equal((await get('drivers')).find(row => row.id === '1').titles, null);
    await db.query(`INSERT INTO historical_championship_standings
      (season_year,entity_kind,position_display_order,position_number,position_text,driver_id,points,championship_won,release_id,source_locator,content_hash)
      VALUES (1950,'driver',1,1,'1',1,1,true,1,'synthetic/final', $1)`, [hash]);
    assert.equal((await get('drivers')).find(row => row.id === '1').titles, 1);
  } finally {
    await db.query('DELETE FROM historical_championship_standings WHERE driver_id=1 AND content_hash=$1', [hash]);
  }
});

test('circuit history, named race, date-only values and result links agree', async () => {
  const [circuit] = await get('circuits/1');
  assert.equal(circuit.races, 1);
  assert.equal(circuit.first_season, 1950);
  const [race] = await get('races/1');
  assert.equal(race.official_name, 'Synthetic shared-car race');
  assert.equal(race.circuit_id, circuit.id);
  assert.equal(race.race_date, '1950-05-13');
  assert.equal((await get('circuits/1/races'))[0].id, race.id);
  assert.equal((await get('seasons/1950/races'))[0].race_date, '1950-05-13');
  const results = await get('races/1/results');
  assert.equal(results[0].driver_id, '1');
  assert.equal(results[0].constructor_id, '1');
  assert.equal(results[0].shared_car, true);
  assert.deepEqual(await get('circuits/2/races'), []);
  assert.deepEqual(await get('seasons/1951/races'), []);
});

test('missing profiles return 404 and invalid IDs return 400', async () => {
  for (const path of ['drivers', 'constructors', 'entrants', 'circuits', 'races']) {
    assert.equal((await fetch(`${base}/api/${path}/999999`)).status, 404);
    assert.equal((await fetch(`${base}/api/${path}/invalid`)).status, 400);
  }
  assert.equal((await fetch(`${base}/api/seasons/2199`)).status, 404);
  assert.equal((await fetch(`${base}/api/seasons/1949`)).status, 400);
});

test('source endpoint reports the registered release and checksum', async () => {
  const [source] = await get('sources');
  assert.equal(source.slug, 'synthetic');
  assert.equal(source.release_tag, 'vfixture');
  assert.equal(source.sha256, 'a'.repeat(64));
  assert.equal(source.artifact_name, 'fixture.json');
});

test('driver season ledger preserves shared-car entries and constructor roster evidence', async () => {
  const results = await get('drivers/1/seasons/1950/results');
  assert.ok(results.length > 0);
  assert.ok(results.every(row => row.race_id && row.constructor_id && row.position_text));
  assert.ok(results.some(row => row.shared_car === true));
  assert.ok(results.every(row => row.round === 1));
  const roster = await get('constructors/1/seasons/1950/drivers');
  assert.ok(roster.some(row => row.driver_id === '1'));
  assert.ok(roster.every(row => Number.isInteger(row.races) && Number.isInteger(row.wins)));
  assert.deepEqual(await get('drivers/1/seasons/1951/results'), []);
  assert.deepEqual(await get('constructors/1/seasons/1951/drivers'), []);
});

test('season ledger and roster reject malformed IDs and years', async () => {
  for (const path of ['drivers/invalid/seasons/1950/results', 'drivers/1/seasons/1949/results',
    'constructors/invalid/seasons/1950/drivers', 'constructors/1/seasons/1949/drivers']) {
    assert.equal((await fetch(`${base}/api/${path}`)).status, 400);
  }
});

test('circuit history exposes shared-car winners without inventing a single winner', async () => {
  const history = await get('circuits/1/history');
  assert.equal(history.length, 1);
  assert.equal(history[0].season_year, 1950);
  assert.equal(history[0].recorded_drivers, 2);
  assert.equal(history[0].recorded_constructors, 1);
  assert.equal(history[0].winner_entries, 2);
  assert.equal(history[0].winners.length, 2);
  assert.deepEqual(await get('circuits/2/history'), []);
  assert.equal((await fetch(`${base}/api/circuits/invalid/history`)).status, 400);
});
