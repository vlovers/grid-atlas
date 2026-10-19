// Real-archive contract check: run only after importing pinned F1DB into a disposable DB.
// Deliberately separate from *.integration.cjs (those tests create synthetic schemas).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');

assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for archive verification');
const db = new Pool({ connectionString: process.env.DATABASE_URL });
let app;
let base;

before(async () => {
  const { rows } = await db.query(`SELECT r.release_tag, r.artifact_name
    FROM source_releases r JOIN data_sources s ON s.id = r.source_id
    WHERE s.slug = 'f1db'`);
  assert.deepEqual(rows, [{
    release_tag: 'v2026.17.0', artifact_name: 'f1db-json-splitted.zip',
  }], 'requires the single pinned F1DB release');
  const { rows: counts } = await db.query(`SELECT
    (SELECT COUNT(*)::int FROM historical_drivers) AS drivers,
    (SELECT COUNT(*)::int FROM historical_race_results) AS results`);
  assert.deepEqual(counts[0], { drivers: 917, results: 27665 },
    'requires the complete pinned archive, not synthetic or partial fixtures');
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});

after(async () => {
  if (app) await app.close();
  await db.end();
});

async function sample(sql, params = []) {
  const { rows } = await db.query(sql, params);
  assert.ok(rows.length, 'expected a qualifying real-archive sample');
  return rows[0];
}

async function getConnections(id, year) {
  const response = await fetch(`${base}/api/explorer/drivers/${id}/connections?year=${year}`);
  assert.equal(response.status, 200, `driver ${id}, year ${year}`);
  return (await response.json()).data;
}

async function independentEdges(id, year) {
  // Independent row-level oracle: no API aggregation query or API helper reused.
  const { rows } = await db.query(`SELECT rr.constructor_id::text AS constructor_id,
    c.display_name AS constructor_name, rr.race_id::text AS race_id,
    rr.position_number, r.round
    FROM historical_race_results rr
    JOIN historical_races r ON r.id = rr.race_id
    JOIN historical_constructors c ON c.id = rr.constructor_id
    WHERE rr.driver_id = $1 AND r.season_year = $2`, [id, year]);
  const grouped = new Map();
  for (const row of rows) {
    let group = grouped.get(row.constructor_id);
    if (!group) {
      group = { id: row.constructor_id, name: row.constructor_name,
        result_entries: 0, races: new Set(), wins: new Set(), first_round: row.round };
      grouped.set(row.constructor_id, group);
    }
    group.result_entries++;
    group.races.add(row.race_id);
    if (row.position_number === 1) group.wins.add(row.race_id);
    group.first_round = Math.min(group.first_round, row.round);
  }
  return [...grouped.values()].sort((a, b) =>
    a.first_round - b.first_round ||
    (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0));
}

async function verify(id, year) {
  const expected = await independentEdges(id, year);
  const actual = await getConnections(id, year);
  const visible = expected.slice(0, actual.limit);
  assert.equal(actual.focus, `driver:${id}`);
  assert.equal(actual.year, year);
  assert.equal(actual.limit, 25);
  assert.equal(actual.truncated, expected.length > 25);
  assert.deepEqual(actual.nodes.map(node => node.key),
    [`driver:${id}`, ...visible.map(group => `constructor:${group.id}`)]);
  assert.deepEqual(actual.nodes.slice(1).map(node => node.name),
    visible.map(group => group.name));
  assert.deepEqual(actual.edges.map(edge => ({
    key: edge.key, from: edge.from, to: edge.to,
    relation_type: edge.relation_type, year: edge.year,
    result_entries: edge.result_entries, races: edge.races,
    winning_races: edge.winning_races, provenance: edge.provenance,
  })), visible.map(group => ({
    key: `driver:${id}:constructor:${group.id}:year:${year}`,
    from: `driver:${id}`, to: `constructor:${group.id}`,
    relation_type: 'driver_competed_for_constructor', year,
    result_entries: group.result_entries, races: group.races.size,
    winning_races: group.wins.size, provenance: 'imported-result-association',
  })));
  assert.equal(actual.source.slug, 'f1db');
  assert.ok(actual.limitations.includes('entity_source_not_per_result_provenance'));
  assert.ok(actual.limitations.includes('constructor_not_entrant_or_legal_continuity'));
  assert.ok(actual.edges.every(edge => !('verified_lineage' in edge)));
}

test('earliest imported driver season matches independent row-level archive oracle', async () => {
  const { id, year } = await sample(`SELECT rr.driver_id::text AS id,
    MIN(r.season_year) AS year
    FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
    GROUP BY rr.driver_id ORDER BY year, rr.driver_id LIMIT 1`);
  await verify(id, year);
});

test('season with the most distinct constructors keeps each canonical identity separate', async () => {
  const { id, year, constructors } = await sample(`SELECT rr.driver_id::text AS id,
    r.season_year AS year, COUNT(DISTINCT rr.constructor_id)::int AS constructors
    FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
    GROUP BY rr.driver_id, r.season_year
    ORDER BY constructors DESC, COUNT(*) DESC, rr.driver_id, year LIMIT 1`);
  assert.ok(constructors >= 2, 'expected a multi-constructor season in pinned archive');
  await verify(id, year);
});

test('shared-race result entries do not inflate distinct race counts', async () => {
  const { id, year } = await sample(`SELECT rr.driver_id::text AS id, r.season_year AS year
    FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
    GROUP BY rr.driver_id, r.season_year, rr.race_id HAVING COUNT(*) > 1
    ORDER BY year, rr.driver_id LIMIT 1`);
  await verify(id, year);
});

test('unobserved season has no invented connections or constructor lineage', async () => {
  const { id } = await sample(`SELECT rr.driver_id::text AS id
    FROM historical_race_results rr ORDER BY rr.race_id, rr.driver_id LIMIT 1`);
  const { year } = await sample(`SELECT s.year FROM historical_seasons s
    WHERE NOT EXISTS (
      SELECT 1 FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      WHERE rr.driver_id = $1 AND r.season_year = s.year
    ) ORDER BY s.year LIMIT 1`, [id]);
  await verify(id, year);
  const actual = await getConnections(id, year);
  assert.deepEqual(actual.edges, []);
  assert.equal(actual.nodes.length, 1);
});
