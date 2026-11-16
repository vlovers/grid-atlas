#!/usr/bin/env node
/**
 * Read-only export of pinned-F1DB circuit facts from an imported archive database.
 *
 * Usage: DATABASE_URL=postgres://... node scripts/export-circuit-archive-facts.mjs > out.json
 *
 * Only SELECT statements are issued (inside a READ ONLY transaction). The output is the
 * committed input of scripts/circuit-content-gap-matrix.mjs, so matrices can be rebuilt
 * and tested in CI without a database.
 */
import { execFileSync } from 'node:child_process';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required (use a disposable/local archive, never production).'); process.exit(2); }

const sql = `
WITH rel AS (SELECT release_tag, artifact_name, sha256 FROM source_releases ORDER BY id DESC LIMIT 1),
circ AS (
  SELECT c.id, e.external_id AS circuit_id, c.display_name AS name, COALESCE(d.fields, '{}'::jsonb) AS fields
  FROM historical_circuits c JOIN external_identities e ON e.id = c.external_identity_id
  LEFT JOIN historical_identity_details d ON d.external_identity_id = c.external_identity_id),
race AS (
  SELECT r.id, r.circuit_id, r.season_year, r.round, r.race_date, r.official_name, ei.external_id AS race_external_id,
    f.layout_id, f.direction, f.turns AS race_turns, f.course_length_km,
    EXISTS (SELECT 1 FROM historical_race_results x WHERE x.race_id = r.id) AS has_results,
    (SELECT json_agg(DISTINCT de.external_id) FROM historical_race_results x JOIN historical_drivers dr ON dr.id = x.driver_id
       JOIN external_identities de ON de.id = dr.external_identity_id WHERE x.race_id = r.id AND x.position_number = 1) AS winners,
    (SELECT json_agg(DISTINCT ce.external_id) FROM historical_race_results x JOIN historical_constructors co ON co.id = x.constructor_id
       JOIN external_identities ce ON ce.id = co.external_identity_id WHERE x.race_id = r.id AND x.position_number = 1) AS winning_constructors,
    (SELECT json_agg(DISTINCT de.external_id) FROM historical_race_results x JOIN historical_drivers dr ON dr.id = x.driver_id
       JOIN external_identities de ON de.id = dr.external_identity_id WHERE x.race_id = r.id AND x.pole_position) AS pole,
    (SELECT json_agg(DISTINCT de.external_id) FROM historical_race_results x JOIN historical_drivers dr ON dr.id = x.driver_id
       JOIN external_identities de ON de.id = dr.external_identity_id WHERE x.race_id = r.id AND x.fastest_lap) AS fastest_lap,
    (SELECT json_agg(json_build_object('position', x.position_number, 'driver', de.external_id) ORDER BY x.position_number, de.external_id)
       FROM historical_race_results x JOIN historical_drivers dr ON dr.id = x.driver_id
       JOIN external_identities de ON de.id = dr.external_identity_id WHERE x.race_id = r.id AND x.position_number BETWEEN 1 AND 3) AS podium
  FROM historical_races r JOIN external_identities ei ON ei.id = r.external_identity_id
  JOIN historical_race_circuit_facts f ON f.race_id = r.id)
SELECT json_build_object(
  'schema_version', 1,
  'source', (SELECT json_build_object('dataset', 'f1db', 'release', release_tag, 'artifact', artifact_name, 'sha256', sha256) FROM rel),
  'circuits', (SELECT json_agg(json_build_object(
      'circuit_id', c.circuit_id, 'name', c.name, 'fields', c.fields,
      'layouts', (SELECT COALESCE(json_agg(json_build_object(
          'layout_id', l.external_layout_id, 'length_km', l.length_km, 'turns', l.turns,
          'seasons', (SELECT COALESCE(json_agg(DISTINCT r.season_year ORDER BY r.season_year), '[]') FROM race r WHERE r.layout_id = l.id),
          'directions', (SELECT COALESCE(json_agg(DISTINCT r.direction), '[]') FROM race r WHERE r.layout_id = l.id AND r.direction IS NOT NULL),
          'race_turn_counts', (SELECT COALESCE(json_agg(DISTINCT r.race_turns), '[]') FROM race r WHERE r.layout_id = l.id),
          'race_ids', (SELECT COALESCE(json_agg(r.race_external_id ORDER BY r.race_date), '[]') FROM race r WHERE r.layout_id = l.id)
        ) ORDER BY (SELECT min(r.race_date) FROM race r WHERE r.layout_id = l.id), l.external_layout_id), '[]')
        FROM historical_circuit_layouts l WHERE l.circuit_id = c.id),
      'races', (SELECT COALESCE(json_agg(json_build_object(
          'race_id', r.race_external_id, 'season', r.season_year, 'round', r.round, 'date', r.race_date, 'name', r.official_name,
          'has_results', r.has_results, 'winners', COALESCE(r.winners, '[]'), 'winning_constructors', COALESCE(r.winning_constructors, '[]'),
          'pole', COALESCE(r.pole, '[]'), 'fastest_lap', COALESCE(r.fastest_lap, '[]'), 'podium', COALESCE(r.podium, '[]')) ORDER BY r.race_date), '[]')
        FROM race r WHERE r.circuit_id = c.id)
    ) ORDER BY c.circuit_id) FROM circ c),
  -- Identity tables let prose checks recognise people and teams by their F1DB slug.
  'drivers', (SELECT json_object_agg(e.external_id, d.display_name ORDER BY e.external_id)
    FROM historical_drivers d JOIN external_identities e ON e.id = d.external_identity_id),
  'constructors', (SELECT json_object_agg(e.external_id, c.display_name ORDER BY e.external_id)
    FROM historical_constructors c JOIN external_identities e ON e.id = c.external_identity_id)
)`;

// Separate -c commands run in one session; only the SELECT produces output.
const out = execFileSync('psql', [url, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
  '-c', 'BEGIN TRANSACTION READ ONLY', '-c', sql, '-c', 'COMMIT'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const json = JSON.parse(out.split('\n').find(line => line.startsWith('{')));
process.stdout.write(`${JSON.stringify(json, null, 1)}\n`);
