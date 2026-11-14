const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync, spawnSync, spawn } = require('node:child_process');
const { mkdtempSync, mkdirSync, copyFileSync, readdirSync, readFileSync, rmSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const { Pool } = require('pg');

const root = resolve(__dirname, '../../..');
const schema = 'result_flags_' + randomUUID().replaceAll('-', '');
const admin = new Pool({ connectionString: process.env.DATABASE_URL });
const scoped = new URL(process.env.DATABASE_URL);
scoped.searchParams.set('options', `-c search_path=${schema}`);
const db = new Pool({ connectionString: scoped.toString() });
const folder = mkdtempSync(join(tmpdir(), 'result-flags-migration-'));
const env = { ...process.env, PGOPTIONS: `-c search_path=${schema}` };
const migrate = () => execFileSync('python3', [join(folder, 'scripts/migrate.py')], { cwd: root, env, stdio: 'pipe' });
const rows = [
  ['1', 1, 'driver-a', 'alpha', 1, '1', '2', 70, 9, null, true, true, true, 'synthetic/result/1', 'b'.repeat(64)],
  ['1', 2, 'driver-b', 'alpha', 1, '1', '2', 70, 9, null, true, false, null, 'synthetic/result/2', 'c'.repeat(64)],
];
function importSql(input, digest = 'a'.repeat(64)) {
  return execFileSync('python3', ['-c',
    "import sys,json;sys.path.insert(0,'packages/data-importer');from import_race_results import build_sql;v=json.load(sys.stdin);print(build_sql(v['rows'],v['digest']))"],
  { cwd: root, input: JSON.stringify({ rows: input, digest }), encoding: 'utf8' });
}
function importRows(input, digest) {
  return spawnSync('psql', [process.env.DATABASE_URL, '-X', '-v', 'ON_ERROR_STOP=1'], { input: importSql(input, digest), env, encoding: 'utf8' });
}

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  mkdirSync(join(folder, 'scripts')); mkdirSync(join(folder, 'migrations'));
  copyFileSync(join(root, 'packages/database/scripts/migrate.py'), join(folder, 'scripts/migrate.py'));
  for (const name of readdirSync(join(root, 'packages/database/migrations')).filter(name => /^\d{4}_/.test(name) && name < '0017_')) {
    copyFileSync(join(root, 'packages/database/migrations', name), join(folder, 'migrations', name));
  }
  migrate();
  const fixtures = readFileSync(join(__dirname, 'fixtures.sql'), 'utf8')
    .replace("('synthetic','", "('f1db','")
    .replaceAll("'shared-car-race'", "'1'")
    .replace("'vfixture','fixture.json'", "'v2026.17.0','f1db-json-splitted.zip'");
  await db.query(fixtures);
});
after(async () => {
  await db.end(); await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await admin.end();
  rmSync(folder, { recursive: true, force: true });
});

test('append-only upgrade preserves legacy results, remains nullable and replays safely', async () => {
  copyFileSync(join(root, 'packages/database/migrations/0017_race_result_flags.sql'), join(folder, 'migrations/0017_race_result_flags.sql'));
  migrate(); migrate();
  const { rows: results } = await db.query('SELECT points::text,pole_position,fastest_lap,flags_release_id FROM historical_race_results ORDER BY id');
  assert.equal(results.length, 2);
  for (const result of results) assert.deepEqual(result, { points: '4.00', pole_position: null, fastest_lap: null, flags_release_id: null });
  assert.equal((await db.query("SELECT count(*)::int AS n FROM schema_migrations WHERE version='0017_race_result_flags.sql'")).rows[0].n, 1);
  await assert.rejects(db.query('UPDATE historical_race_results SET pole_position=true WHERE id=1'), /race_result_flags_provenance/);
});

test('pinned backfill changes flags only, preserves curated results and becomes a no-op on replay', async () => {
  const imported = importRows(rows); assert.equal(imported.status, 0, imported.stderr);
  const { rows: results } = await db.query('SELECT points::text,pole_position,fastest_lap,flags_source_locator FROM historical_race_results ORDER BY id');
  assert.deepEqual(results.map(row => row.points), ['4.00', '4.00']);
  assert.deepEqual(results.map(row => row.pole_position), [true, false]);
  assert.deepEqual(results.map(row => row.fastest_lap), [true, null]);
  assert.equal(results[0].flags_source_locator, 'synthetic/result/1');
  const repeated = importRows(rows); assert.equal(repeated.status, 0, repeated.stderr);
  assert.match(repeated.stdout, /INSERT 0 0/);
});

test('wrong identity or mismatched release aborts without partially changing prior flags', async () => {
  const wrong = structuredClone(rows); wrong[0][11] = false; wrong[1][2] = 'driver-a';
  const conflict = importRows(wrong); assert.notEqual(conflict.status, 0);
  assert.match(conflict.stderr, /Existing result identity differs/);
  assert.equal((await db.query('SELECT pole_position FROM historical_race_results WHERE id=1')).rows[0].pole_position, true);
  const mismatch = importRows(rows, 'd'.repeat(64)); assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /Matching F1DB release not imported/);
});

test('later curated identity changes revoke source flags while point-only edits preserve them', async () => {
  try {
    await db.query('UPDATE historical_race_results SET points=12 WHERE id=1');
    assert.equal((await db.query('SELECT pole_position FROM historical_race_results WHERE id=1')).rows[0].pole_position, true);
    await db.query('UPDATE historical_race_results SET driver_id=2 WHERE id=1');
    const row = (await db.query('SELECT pole_position,fastest_lap,flags_release_id,flags_source_locator,flags_content_hash FROM historical_race_results WHERE id=1')).rows[0];
    assert.deepEqual(row, { pole_position: null, fastest_lap: null, flags_release_id: null, flags_source_locator: null, flags_content_hash: null });
  } finally {
    await db.query('UPDATE historical_race_results SET driver_id=1,points=4 WHERE id=1');
    const restored = importRows(rows); assert.equal(restored.status, 0, restored.stderr);
  }
});

test('a concurrent identity edit is observed after the importer waits for its real row lock', async () => {
  const editor = await db.connect();
  const tag = 'flag_import_' + randomUUID().replaceAll('-', '');
  let child;
  try {
    await editor.query('BEGIN');
    await editor.query('UPDATE historical_race_results SET driver_id=1 WHERE id=2');
    child = spawn('psql', [process.env.DATABASE_URL, '-X', '-v', 'ON_ERROR_STOP=1'], { env: { ...env, PGAPPNAME: tag } });
    let stderr = ''; child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdout.resume();
    const completed = new Promise((resolve, reject) => { child.on('error', reject); child.on('close', code => resolve(code)); });
    child.stdin.end(importSql(rows));
    let waiting = false;
    for (let i = 0; i < 150; i++) {
      const { rows: observed } = await admin.query("SELECT 1 FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'", [tag]);
      if (observed.length) { waiting = true; break; }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(waiting, true, 'observe actual PostgreSQL lock contention');
    await editor.query('COMMIT');
    assert.notEqual(await completed, 0);
    assert.match(stderr, /Existing result identity differs/);
    assert.equal((await db.query('SELECT driver_id::text FROM historical_race_results WHERE id=2')).rows[0].driver_id, '1');
  } finally {
    await editor.query('ROLLBACK'); editor.release();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await db.query('UPDATE historical_race_results SET driver_id=2 WHERE id=2');
  }
});

test('a concurrent insertion into an absent result slot cannot receive another driver’s flags', async () => {
  const editor = await db.connect();
  const tag = 'flag_insert_' + randomUUID().replaceAll('-', '');
  let child;
  try {
    await editor.query('BEGIN');
    await editor.query(`INSERT INTO historical_race_results(race_id,driver_id,constructor_id,
      position_display_order,position_number,position_text,driver_number,shared_car)
      VALUES(1,2,1,3,3,'3','3',false)`);
    const input = structuredClone(rows); input[0][11] = false;
    input.push(['1', 3, 'driver-a', 'alpha', 3, '3', '3', 70, 0, null, false, true, false, 'synthetic/result/3', 'd'.repeat(64)]);
    child = spawn('psql', [process.env.DATABASE_URL, '-X', '-v', 'ON_ERROR_STOP=1'], { env: { ...env, PGAPPNAME: tag } });
    let stderr = ''; child.stderr.on('data', chunk => { stderr += chunk; }); child.stdout.resume();
    const completed = new Promise((resolve, reject) => { child.on('error', reject); child.on('close', code => resolve(code)); });
    child.stdin.end(importSql(input));
    let waiting = false;
    for (let i = 0; i < 150; i++) {
      const { rows: observed } = await admin.query("SELECT 1 FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'", [tag]);
      if (observed.length) { waiting = true; break; }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(waiting, true, 'observe real conflict on the newly inserted slot');
    await editor.query('COMMIT');
    assert.notEqual(await completed, 0); assert.match(stderr, /Existing result identity differs/);
    const result = (await db.query('SELECT driver_id::text,pole_position,flags_release_id FROM historical_race_results WHERE race_id=1 AND position_display_order=3')).rows[0];
    assert.deepEqual(result, { driver_id: '2', pole_position: null, flags_release_id: null });
    assert.equal((await db.query('SELECT pole_position FROM historical_race_results WHERE id=1')).rows[0].pole_position, true, 'earlier updates rolled back');
  } finally {
    await editor.query('ROLLBACK'); editor.release();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await db.query('DELETE FROM historical_race_results WHERE race_id=1 AND position_display_order=3');
  }
});
