const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { createServer } = require('node:net');
const { resolve } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { Pool } = require('pg');
const { apiConfig } = require('../dist/config');

const database = 'postgresql://fixture-user:secret-canary@localhost/fixture';

test('API startup config validates without returning environment values in errors', () => {
  assert.deepEqual(apiConfig({ DATABASE_URL: database }), { databaseUrl: database, port: 3001, host: '127.0.0.1' });
  assert.equal(apiConfig({ DATABASE_URL: database, PORT: '65535', HOST: '::1' }).port, 65535);
  for (const DATABASE_URL of [undefined, '', 'secret-canary', 'https://user:secret-canary@example.org/db',
    'postgresql://localhost', 'postgresql://localhost/db#secret-canary', 'postgresql://localhost:0/db',
    'postgresql://fixture:secret-canary%ZZ@localhost/db']) {
    assert.throws(() => apiConfig({ DATABASE_URL }), error =>
      error.message.includes('DATABASE_URL') && !error.message.includes('secret-canary'));
  }
  for (const PORT of ['', '0', '-1', '65536', '1.1', ' 3001', 'secret-canary']) {
    assert.throws(() => apiConfig({ DATABASE_URL: database, PORT }), /PORT must be an integer/);
  }
  for (const HOST of ['', '-bad', '..', '::invalid', 'https://secret-canary', 'localhost/path']) {
    assert.throws(() => apiConfig({ DATABASE_URL: database, HOST }), /HOST must be an IP address or hostname/);
  }
});

const root = resolve(__dirname, '../../..');
const schema = 'operations_test_' + randomUUID().replaceAll('-', '');
const originalUrl = process.env.DATABASE_URL;
assert.ok(originalUrl, 'DATABASE_URL must point to disposable PostgreSQL');
const admin = new Pool({ connectionString: originalUrl });
let scopedUrl;

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  execFileSync('python3', ['packages/database/scripts/migrate.py'], {
    cwd: root, env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` }, stdio: 'pipe',
  });
  scopedUrl = new URL(originalUrl);
  scopedUrl.searchParams.set('options', `-c search_path=${schema}`);
  scopedUrl.searchParams.set('application_name', schema);
  await admin.query(`INSERT INTO ${schema}.historical_seasons(year) VALUES (1950)`);
  await admin.query(`WITH s AS (
    INSERT INTO ${schema}.data_sources(slug,homepage_url,attribution)
    VALUES ('operations-fixture','https://example.org','Synthetic operations test only') RETURNING id
  ) INSERT INTO ${schema}.source_releases(source_id,release_tag,artifact_name,sha256)
    SELECT id,'synthetic','fixture.json',repeat('a',64) FROM s`);
});
after(async () => {
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
});

async function port() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const value = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return value;
}

async function api(t, databaseUrl = scopedUrl.toString(), portOverride) {
  const listenPort = portOverride ?? await port();
  const child = spawn(process.execPath, ['dist/main.js'], {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl, HOST: '127.0.0.1', PORT: String(listenPort), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const exit = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  t.after(async () => {
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 12000);
    await exit;
    clearTimeout(timer);
  });
  return { child, exit, base: `http://127.0.0.1:${listenPort}`, output: () => output };
}

async function listening(server) {
  const started = Date.now();
  while (!server.output().includes('api_listening')) {
    assert.ok(Date.now() - started < 10000, 'API did not reach listening state');
    assert.equal(server.child.exitCode, null, 'API exited during startup');
    await delay(20);
  }
}
const get = (server, path) => fetch(server.base + path, { signal: AbortSignal.timeout(8500) });

test('draining rejects readiness without a query and enforces the shutdown deadline', async t => {
  const { ApiRuntime } = require('../dist/runtime');
  let ended = false;
  const runtime = new ApiRuntime({
    query: () => assert.fail('draining must not acquire a database connection'),
    end: async () => { ended = true; },
  });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const exit = t.mock.method(process, 'exit', () => {});
  runtime.onModuleDestroy();
  assert.equal(await runtime.ready(), false);
  t.mock.timers.tick(10000);
  assert.equal(exit.mock.calls[0].arguments[0], 1);
  await runtime.onApplicationShutdown();
  assert.equal(ended, true);
});

test('invalid startup config exits nonzero with a structured, secret-free error', async t => {
  const server = await api(t, 'https://fixture:secret-canary@example.org/database');
  assert.equal((await server.exit).code, 1);
  const logs = server.output().trim().split('\n').map(line => JSON.parse(line));
  assert.ok(logs.some(row => row.message.event === 'startup_failed'));
  assert.ok(server.output().includes('DATABASE_URL must be'));
  assert.ok(!server.output().includes('secret-canary'));
});

test('occupied listen port fails startup and closes initialized resources', async t => {
  const occupied = createServer();
  await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve));
  t.after(() => occupied.close());
  const server = await api(t, scopedUrl.toString(), occupied.address().port);
  assert.equal((await server.exit).code, 1);
  assert.ok(server.output().includes('startup_failed'));
  assert.ok(server.output().includes('shutdown_completed'));
});

test('production process handles readiness, idle connection loss, smoke probes and SIGTERM', async t => {
  const server = await api(t);
  await listening(server);
  assert.deepEqual(await (await get(server, '/api/health')).json(), { status: 'ok' });
  const ready = await get(server, '/api/ready');
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await ready.json(), { status: 'ready' });
  const { smokeDeployment } = await import('../../../scripts/smoke-deployment.mjs');
  assert.equal((await smokeDeployment(server.base)).length, 4);
  const killed = await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name=$1', [schema]);
  assert.ok(killed.rowCount > 0, 'must terminate only this test process pool connection');
  for (let i = 0; i < 100 && !server.output().includes('database_pool_error'); i++) await delay(20);
  assert.ok(server.output().includes('database_pool_error'));
  assert.equal((await get(server, '/api/health')).status, 200);
  assert.equal((await get(server, '/api/ready')).status, 200);
  const started = Date.now();
  server.child.kill('SIGTERM');
  assert.deepEqual(await server.exit, { code: null, signal: 'SIGTERM' });
  assert.ok(Date.now() - started < 10000);
  assert.ok(server.output().includes('shutdown_completed'));
});

test('unresponsive database yields bounded 503 readiness while liveness remains available', async t => {
  const sockets = new Set();
  const silentDatabase = createServer(socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise(resolve => silentDatabase.listen(0, '127.0.0.1', resolve));
  t.after(() => { for (const socket of sockets) socket.destroy(); silentDatabase.close(); });
  const server = await api(t, `postgresql://fixture:secret-canary@127.0.0.1:${silentDatabase.address().port}/fixture`);
  await listening(server);
  const started = Date.now();
  const response = await get(server, '/api/ready');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'not_ready' });
  assert.ok(Date.now() - started < 8000, 'readiness acquisition must time out');
  assert.equal((await get(server, '/api/health')).status, 200);
  assert.ok(!server.output().includes('secret-canary'));
});

test('SQL failures stay generic and logs exclude raw paths, query strings and credentials', async t => {
  const missing = new URL(scopedUrl);
  missing.searchParams.set('options', `-c search_path=${schema}_absent`);
  const server = await api(t, missing.toString());
  await listening(server);
  const response = await get(server, '/api/seasons?token=secret-canary');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: 'not_ready' });
  assert.equal((await get(server, '/api/ready')).status, 503);
  assert.equal((await get(server, '/api/secret-canary')).status, 404);
  await delay(20);
  assert.ok(!server.output().includes('secret-canary'));
  const logs = server.output().trim().split('\n').map(line => JSON.parse(line));
  assert.ok(logs.some(row => row.message.event === 'request_failed'));
  assert.ok(logs.some(row => row.message.event === 'http_request' && row.message.route === '/api/seasons' &&
    row.message.status === 503 && Number.isInteger(row.message.duration_ms)));
  assert.ok(logs.some(row => row.message.event === 'request_failed' && row.message.database_code === '42P01' && row.message.route === '/api/seasons'));
});

test('a populated old schema is not ready, and readiness recovers after the ledger is repaired', async () => {
  const { ApiRuntime } = require('../dist/runtime');
  const required = require('../dist/schema-contract.json');
  const rows = Object.entries(required).map(([version, checksum]) => ({ version, checksum }));
  const runtime = new ApiRuntime({ query: async () => ({ rows }) });
  assert.equal(await runtime.ready(), true);
  const last = rows.pop();
  assert.equal(await runtime.ready(), false);
  rows.push({ ...last, checksum: '0'.repeat(64) });
  assert.equal(await runtime.ready(), false);
  rows[rows.length - 1] = last;
  assert.equal(await runtime.ready(), true);
});
