const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required for PostgreSQL/HTTP profile tests');
const schema = 'profile_test_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: databaseUrl });
let app, db, base;

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  execFileSync('python3', ['packages/database/scripts/migrate.py'], {
    cwd: resolve(__dirname, '../../..'),
    env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` }, stdio: 'pipe',
  });
  const scopedUrl = new URL(databaseUrl);
  scopedUrl.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = scopedUrl.toString();
  db = new Pool({ connectionString: scopedUrl.toString() });
  await db.query(readFileSync(resolve(__dirname, 'profiles-fixtures.sql'), 'utf8'));
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
  const response = await fetch(`${base}/api/${path}`);
  assert.equal(response.status, 200, path);
  return (await response.json()).data;
}

test('driver timeline preserves gaps, same-race entries and separate constructors', async () => {
  const [profile] = await get('drivers/1/career');
  assert.equal(profile.entity_type, 'driver');
  assert.equal(profile.related_entity_type, 'constructor');
  assert.deepEqual(profile.summary, {
    result_entries: 4, races: 3, seasons: 2, first_season: 1950, last_season: 1952,
    winning_races: 2, podium_result_entries: 3, recorded_points: '4.00',
    points_recorded: 2, points_missing: 2,
  });
  assert.deepEqual(profile.participation.map(row => [row.year, row.related_id, row.races]),
    [[1950, '1', 2], [1950, '2', 1], [1952, '2', 1]]);
  for (const row of profile.participation) {
    const [related] = await get(`constructors/${row.related_id}`);
    assert.equal(row.related_name, related.name);
    assert.equal(row.related_external_id, related.external_id);
    assert.equal(row.related_source_slug, 'synthetic');
    assert.equal((await get(`seasons/${row.year}`))[0].year, row.year);
    for (const race of [row.first_race, row.last_race]) {
      assert.equal((await get(`races/${race.id}`))[0].official_name, race.name);
    }
  }
  assert.equal(profile.participation[1].recorded_points, null);
  assert.equal(profile.participation[2].recorded_points, '0.00');
});

test('milestones use season/round rather than insertion IDs or nullable dates', async () => {
  const [profile] = await get('drivers/1/career');
  const { first_appearance, last_appearance, first_win, last_win } = profile.milestones;
  assert.equal(first_appearance.race.id, '3');
  assert.equal(first_appearance.race.date, '1950-12-31');
  assert.equal(first_appearance.results[0].position_text, 'DNS');
  assert.equal(first_appearance.results[0].position_number, null);
  assert.equal(first_appearance.results[0].reason_retired, 'Did not start');
  assert.equal(first_appearance.race.circuit_id, null);
  assert.equal(first_win.race.id, '2');
  assert.equal(first_win.race.date, '1950-01-01');
  assert.deepEqual(first_win.results.map(row => row.constructor_id), ['1', '2']);
  assert.deepEqual(first_win.results.map(row => row.position_number), [1, 3]);
  assert.ok(first_win.results.every(row => row.shared_car));
  assert.equal(last_appearance.race.id, '1');
  assert.equal(last_appearance.race.date, null);
  assert.deepEqual(last_win, last_appearance);
});

test('repeated entries at both participation boundaries keep first/last races and every result', async () => {
  // Insert the later round first and give both repeats the same display order.
  // Result IDs, insertion order and dates must not override season/round order.
  const { rows: inserted } = await db.query(`INSERT INTO historical_race_results
    (race_id,driver_id,constructor_id,position_display_order,position_text,driver_number,shared_car)
    VALUES (2,1,1,4,'DNF','11',true), (3,1,1,4,'DNF','11',true)
    RETURNING id::text`);
  try {
    for (const kind of ['drivers', 'constructors']) {
      const [profile] = await get(`${kind}/1/career`);
      const participation = profile.participation.find(row => row.year === 1950 && row.related_id === '1');
      assert.equal(participation.result_entries, 4);
      assert.equal(participation.races, 2);
      assert.equal(participation.first_race.id, '3');
      assert.equal(participation.first_race.round, 1);
      assert.equal(participation.last_race.id, '2');
      assert.equal(participation.last_race.round, 2);
      assert.deepEqual(profile.milestones.first_appearance.race, participation.first_race);
      assert.deepEqual(profile.milestones.first_appearance.results.map(row => row.position_display_order), [1, 4]);
      assert.deepEqual(profile.milestones.first_win.race, participation.last_race);
      assert.deepEqual(profile.milestones.first_win.results.map(row => row.position_display_order),
        kind === 'drivers' ? [1, 3, 4] : [1, 2, 4]);
      // A second request must preserve boundary selection and result ordering.
      assert.deepEqual((await get(`${kind}/1/career`))[0], profile);
    }
  } finally {
    await db.query('DELETE FROM historical_race_results WHERE id = ANY($1::bigint[])', [inserted.map(row => row.id)]);
  }
});

test('constructor career deduplicates shared-car wins and links actual drivers', async () => {
  const [profile] = await get('constructors/1/career');
  assert.equal(profile.entity_type, 'constructor');
  assert.equal(profile.related_entity_type, 'driver');
  assert.equal(profile.summary.result_entries, 3);
  assert.equal(profile.summary.races, 2);
  assert.equal(profile.summary.winning_races, 1);
  assert.equal(profile.summary.podium_result_entries, 2);
  assert.equal(profile.summary.recorded_points, '8.00');
  assert.deepEqual(profile.participation.map(row => row.related_id), ['1', '2']);
  for (const row of profile.participation) {
    assert.equal((await get(`drivers/${row.related_id}`))[0].name, row.related_name);
  }
  assert.equal(profile.milestones.first_win.results.length, 2);
  assert.equal((await get('entrants/1'))[0].name, 'Separate entrant alpha');
  assert.ok(!JSON.stringify(profile).includes('Separate entrant alpha'));
  assert.ok(profile.limitations.includes('constructor_association_not_entrant_or_legal_continuity'));
});

test('provenance includes exact observed entity releases, never unrelated registrations', async () => {
  const [driver] = await get('drivers/1/career');
  assert.equal(driver.source_slug, 'synthetic');
  assert.equal(driver.external_id, 'alpha');
  assert.equal(driver.source_url, 'https://example.org/profiles');
  assert.equal(driver.attribution, 'Synthetic profile fixtures');
  assert.deepEqual(driver.observations, [{
    release_tag: 'vfixture', artifact_name: 'profiles.json',
    sha256: 'a'.repeat(64), content_hash: 'd'.repeat(64),
  }]);
  assert.equal((await get('constructors/1/career'))[0].observations[0].content_hash, 'e'.repeat(64));
  assert.deepEqual((await get('drivers/2/career'))[0].observations, []);
  assert.ok(driver.limitations.includes('entity_observations_not_result_provenance'));
  for (const profile of [driver, (await get('constructors/1/career'))[0]]) {
    for (const row of profile.participation) assert.equal(Object.hasOwn(row, 'observations'), false);
    for (const milestone of Object.values(profile.milestones)) {
      if (!milestone) continue;
      assert.equal(Object.hasOwn(milestone.race, 'observations'), false);
      for (const result of milestone.results) assert.equal(Object.hasOwn(result, 'observations'), false);
    }
  }
});

test('known profiles with no results have honest empty careers and no invented milestones', async () => {
  for (const kind of ['drivers', 'constructors']) {
    const [profile] = await get(`${kind}/3/career`);
    assert.deepEqual(profile.participation, []);
    assert.deepEqual(profile.observations, []);
    assert.deepEqual(profile.milestones, {
      first_appearance: null, last_appearance: null, first_win: null, last_win: null,
    });
    assert.deepEqual(profile.summary, {
      result_entries: 0, races: 0, seasons: 0, first_season: null, last_season: null,
      winning_races: 0, podium_result_entries: 0, recorded_points: null,
      points_recorded: 0, points_missing: 0,
    });
  }
});

test('a participating nonwinner has no win milestones', async () => {
  await db.query(`INSERT INTO historical_race_results
    (race_id,driver_id,constructor_id,position_display_order,position_text,driver_number)
    VALUES (3,3,3,2,'DNF','99')`);
  try {
    for (const kind of ['drivers', 'constructors']) {
      const [profile] = await get(`${kind}/3/career`);
      assert.equal(profile.milestones.first_appearance.race.id, '3');
      assert.equal(profile.milestones.first_win, null);
      assert.equal(profile.milestones.last_win, null);
      assert.equal(profile.summary.recorded_points, null);
      assert.equal(profile.summary.points_missing, 1);
    }
  } finally {
    await db.query('DELETE FROM historical_race_results WHERE driver_id=3');
  }
});

test('editorial defaults to Ukrainian, preserves requested English and remains empty', async () => {
  for (const kind of ['drivers', 'constructors']) {
    for (const [query, locale] of [['', 'uk'], ['?locale=uk', 'uk'], ['?locale=en', 'en']]) {
      const [profile] = await get(`${kind}/1/career${query}`);
      assert.deepEqual(profile.editorial, { locale, introduction: null, biography: null });
    }
    for (const query of ['locale=ru', 'locale=', 'locale=uk&locale=en']) {
      assert.equal((await fetch(`${base}/api/${kind}/1/career?${query}`)).status, 400, query);
    }
  }
});

test('career IDs remain exact BIGINT strings; missing and malformed requests differ', async () => {
  const [large] = await get('drivers/9007199254740993/career');
  assert.equal(large.id, '9007199254740993');
  for (const kind of ['drivers', 'constructors']) {
    for (const id of ['999999', '9223372036854775807']) {
      assert.equal((await fetch(`${base}/api/${kind}/${id}/career`)).status, 404);
    }
    for (const id of ['0', '-1', '01', 'invalid', '1.5', '9223372036854775808', '1%27OR%201=1']) {
      assert.equal((await fetch(`${base}/api/${kind}/${id}/career`)).status, 400, id);
    }
  }
});


test('Explorer returns bounded, canonical driver-to-constructor connections for one season', async () => {
  const response = await fetch(`${base}/api/explorer/drivers/1/connections?year=1950`);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.focus, 'driver:1');
  assert.equal(data.year, 1950);
  assert.equal(data.truncated, false);
  assert.deepEqual(data.nodes.map(node => node.key), ['driver:1', 'constructor:1', 'constructor:2']);
  assert.deepEqual(data.edges.map(edge => [edge.key, edge.races, edge.result_entries]),
    [
      ['driver:1:constructor:1:year:1950', 2, 2],
      ['driver:1:constructor:2:year:1950', 1, 1],
    ]);
  assert.ok(data.edges.every(edge => edge.provenance === 'imported-result-association'));
  assert.ok(data.edges.every(edge => edge.relation_type === 'driver_recorded_result_for_constructor'));
  assert.equal(data.edges[0].result_entries, 2); // Includes the DNS result entry; not official starts.
  assert.equal(data.source.slug, 'synthetic');
  assert.ok(!Object.hasOwn(data.edges[0], 'source_url'));
  assert.ok(data.limitations.includes('entity_source_not_per_result_provenance'));
  assert.ok(!JSON.stringify(data).includes('Separate entrant alpha'));
});

test('Explorer does not infer participation in a season gap or from another season', async () => {
  const gap = await get('explorer/drivers/1/connections?year=1951');
  assert.deepEqual(gap.nodes.map(node => node.key), ['driver:1']);
  assert.deepEqual(gap.edges, []);
  const later = await get('explorer/drivers/1/connections?year=1952');
  assert.deepEqual(later.edges.map(edge => edge.to), ['constructor:2']);
  assert.equal(later.edges[0].year, 1952);
});

test('Explorer rejects malformed inputs and distinguishes missing driver', async () => {
  for (const query of ['','?year=0','?year=1949','?year=2201','?year=1950&year=1952','?year=abc']) {
    assert.equal((await fetch(`${base}/api/explorer/drivers/1/connections${query}`)).status, 400, query);
  }
  for (const id of ['0','01','invalid','9223372036854775808']) {
    assert.equal((await fetch(`${base}/api/explorer/drivers/${id}/connections?year=1950`)).status, 400, id);
  }
  assert.equal((await fetch(`${base}/api/explorer/drivers/999999/connections?year=1950`)).status, 404);
});

test('Explorer reports a bounded graph for 26 observed constructors', async () => {
  const identities = [];
  const constructors = [];
  try {
    for (let index = 0; index < 26; index++) {
      const identity = await db.query("INSERT INTO external_identities(source_id, entity_kind, external_id) VALUES (1, 'constructor', $1) RETURNING id::text", ['hx-cap-' + index]);
      identities.push(identity.rows[0].id);
      const constructor = await db.query('INSERT INTO historical_constructors(external_identity_id, display_name) VALUES ($1, $2) RETURNING id::text', [identity.rows[0].id, 'HX cap ' + index]);
      constructors.push(constructor.rows[0].id);
      await db.query("INSERT INTO historical_race_results(race_id, driver_id, constructor_id, position_display_order, position_text, driver_number) VALUES (3, 1, $1, $2, 'DNS', '1')", [constructor.rows[0].id, index + 10]);
    }
    const graph = await get('explorer/drivers/1/connections?year=1950');
    assert.equal(graph.truncated, true);
    assert.equal(graph.limit, 25);
    assert.equal(graph.edges.length, 25);
    assert.equal(graph.nodes.length, 26);
    assert.equal(new Set(graph.edges.map(edge => edge.to)).size, 25);
    assert.deepEqual((await get('explorer/drivers/1/connections?year=1950')).edges, graph.edges);
  } finally {
    if (constructors.length) {
      await db.query('DELETE FROM historical_race_results WHERE constructor_id = ANY($1::bigint[])', [constructors]);
      await db.query('DELETE FROM historical_constructors WHERE id = ANY($1::bigint[])', [constructors]);
    }
    if (identities.length) await db.query('DELETE FROM external_identities WHERE id = ANY($1::bigint[])', [identities]);
  }
});
