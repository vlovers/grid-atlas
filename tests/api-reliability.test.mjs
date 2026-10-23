import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { ApiRequestError, apiOrigin, arrayData, requestApi, requestArray, optionalEnrichment } from '../apps/web/src/lib/api-client.ts';

test('readiness contract tracks every checked-in migration and exact checksum', () => {
  const contract = JSON.parse(readFileSync('apps/api/src/schema-contract.json', 'utf8'));
  const files = readdirSync('packages/database/migrations').filter(file => file.endsWith('.sql')).sort();
  assert.deepEqual(Object.keys(contract), files);
  for (const file of files) assert.equal(contract[file], createHash('sha256').update(readFileSync(`packages/database/migrations/${file}`)).digest('hex'));
});

test('production requires an explicit server-only origin; development alone gets loopback fallback', () => {
  assert.equal(apiOrigin(undefined, false), 'http://127.0.0.1:3001');
  assert.equal(apiOrigin('http://api:3001', true), 'http://api:3001');
  for (const value of [undefined, '', ' http://api:3001', 'http://user:secret-canary@api:3001', 'http://api:3001/api', 'http://api:3001/?secret-canary', 'file:///tmp/a']) {
    assert.throws(() => apiOrigin(value, true), error => error.reason === 'configuration' && !error.message.includes('secret-canary'));
  }
});

const options = { base: 'http://fixture.invalid', production: true };
test('essential data preserves HTTP, transport, malformed JSON and envelope failures', async () => {
  for (const status of [404, 500, 503]) {
    await assert.rejects(requestApi('/api/drivers/72?token=secret-canary', { ...options, request: async () => new Response('', { status }), log: record => {
      assert.equal(record.endpoint, '/api/drivers/:id');
      assert.ok(!JSON.stringify(record).includes('secret-canary'));
    } }), error => error instanceof ApiRequestError && error.status === status);
  }
  await assert.rejects(requestApi('/api/seasons/2025', { ...options, request: async () => { throw new Error('secret-canary'); }, log: () => {} }), { reason: 'transport' });
  await assert.rejects(requestApi('/api/circuits/45', { ...options, request: async () => new Response('<html>secret-canary</html>'), log: () => {} }), { reason: 'contract' });
  for (const payload of [null, {}, { data: null }, { data: {} }]) assert.throws(() => arrayData(payload), { reason: 'contract' });
  assert.deepEqual(arrayData({ data: [] }), []);
});

test('the request budget bounds waiting for headers and JSON body', async () => {
  for (const body of [false, true]) {
    let observedSignal;
    const pending = requestApi('/api/races/1', { ...options, timeoutMs: 10, log: () => {}, request: async (_url, { signal }) => {
      observedSignal = signal;
      const wait = () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
      if (body) return { ok: true, json: wait };
      return wait();
    } });
    // AbortSignal.timeout is unref'd; retain a timer while testing synthetic I/O.
    const keepAlive = setTimeout(() => {}, 200);
    await assert.rejects(pending, { reason: 'timeout' });
    clearTimeout(keepAlive);
    assert.equal(observedSignal.aborted, true);
  }
});

test('optional enrichment distinguishes absent content from an outage and never swallows programming errors', async () => {
  assert.deepEqual(await optionalEnrichment(async () => null), { status: 'available', value: null });
  assert.deepEqual(await optionalEnrichment(async () => { throw new ApiRequestError('http', 503); }), { status: 'unavailable', value: null });
  await assert.rejects(optionalEnrichment(async () => { throw new TypeError('bug'); }), TypeError);
});


test('optional record connections distinguish an empty archive from HTTP and envelope failures', async () => {
  const path = '/api/constructors/114/seasons/1988/drivers?private=secret-canary';
  const diagnostics = [];
  const load = payload => optionalEnrichment(() => requestArray(path, { ...options,
    log: record => diagnostics.push(record), request: async () => new Response(JSON.stringify(payload)) }));
  assert.deepEqual(await load({ data: [] }), { status: 'available', value: [] });
  assert.deepEqual(await load({ data: [{ driver_id: '72', driver_name: 'Recorded driver' }] }),
    { status: 'available', value: [{ driver_id: '72', driver_name: 'Recorded driver' }] });
  assert.deepEqual(await load({ data: null }), { status: 'unavailable', value: null });
  assert.deepEqual(diagnostics, [{ event: 'archive_api_failed', endpoint: '/api/constructors/:id/seasons/:id/drivers', reason: 'contract' }]);
  assert.deepEqual(await optionalEnrichment(() => requestArray(path, { ...options,
    log: () => {}, request: async () => new Response('', { status: 503 }) })), { status: 'unavailable', value: null });
  await assert.rejects(requestArray(path, { ...options, log: () => {},
    request: async () => new Response('', { status: 503 }) }), { status: 503 });
});
