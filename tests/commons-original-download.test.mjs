import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadCommonsOriginal } from '../scripts/commons-original-download.mjs';

const url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Synthetic%20test.jpg';
const reply = (status, retryAfter) => new Response(status === 200 ? 'synthetic bytes' : 'unavailable', {
  status, headers: retryAfter === undefined ? {} : { 'Retry-After': retryAfter },
});
const harness = responses => {
  const waits = [], calls = [];
  return { waits, calls, options: {
    fetchImpl: async (target, options) => { calls.push({ target, options }); return responses.shift(); },
    wait: async delay => { waits.push(delay); }, now: () => Date.parse('2026-11-05T00:00:00Z'),
  } };
};

test('429 and transient server errors retry the exact original and preserve response bytes', async () => {
  const success = reply(200);
  const first = reply(429), second = reply(503);
  const h = harness([first, second, success]);
  assert.equal(await downloadCommonsOriginal(url, h.options), success);
  assert.deepEqual(h.waits, [15000, 45000]);
  assert.equal(first.bodyUsed, true);
  assert.equal(second.bodyUsed, true);
  assert.ok(h.calls.every(call => call.target === url && call.options.redirect === 'follow' && call.options.signal instanceof AbortSignal));
  assert.equal(await success.text(), 'synthetic bytes');
});

test('Retry-After seconds and HTTP dates are honored without early requests', async () => {
  const h = harness([reply(429, '30'), reply(503, 'Thu, 05 Nov 2026 00:00:50 GMT'), reply(200)]);
  let time = Date.parse('2026-11-05T00:00:00Z');
  h.options.now = () => time;
  h.options.wait = async delay => { h.waits.push(delay); time += delay; };
  await downloadCommonsOriginal(url, h.options);
  assert.deepEqual(h.waits, [30000, 45000], 'both server minimum and increasing backoff apply');
});

test('persistent throttling and excessive Retry-After remain failures within the fixed budget', async () => {
  const h = harness(Array.from({ length: 4 }, () => reply(429)));
  await assert.rejects(downloadCommonsOriginal(url, h.options), /HTTP 429/);
  assert.equal(h.calls.length, 4);
  assert.deepEqual(h.waits, [15000, 45000, 60000]);
  for (const value of ['181', '9999999999999999999999999999999999999999999999999999999999999999999999999999', 'Thu, 05 Nov 2026 00:10:00 GMT']) {
    const throttled = harness([reply(429, value)]);
    await assert.rejects(downloadCommonsOriginal(url, throttled.options), /bounded retry budget/);
    assert.equal(throttled.calls.length, 1);
    assert.deepEqual(throttled.waits, []);
  }
});

test('cumulative retry waits cannot exceed the budget and expired headers cannot spin', async () => {
  const h = harness([reply(429, '120'), reply(429, '90')]);
  await assert.rejects(downloadCommonsOriginal(url, h.options), /bounded retry budget/);
  assert.deepEqual(h.waits, [120000]);
  assert.equal(h.calls.length, 2);
  const invalid = harness([reply(429, 'not-a-date'), reply(429, 'Wed, 04 Nov 2026 00:00:00 GMT'), reply(200)]);
  await downloadCommonsOriginal(url, invalid.options);
  assert.deepEqual(invalid.waits, [15000, 45000]);
});

test('actual Commons short-then-long Retry-After pattern waits rather than exhausting attempts immediately', async () => {
  const h = harness([reply(429, '0'), reply(429, '120'), reply(200)]);
  await downloadCommonsOriginal(url, h.options);
  assert.deepEqual(h.waits, [15000, 120000]);
});

test('authorization, missing files and network failures are never converted into success', async () => {
  for (const status of [400, 401, 403, 404]) {
    const h = harness([reply(status)]);
    await assert.rejects(downloadCommonsOriginal(url, h.options), new RegExp('HTTP ' + status));
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.waits, []);
  }
  await assert.rejects(downloadCommonsOriginal(url, { fetchImpl: async () => { throw new Error('synthetic network failure'); } }), /network failure/);
});
