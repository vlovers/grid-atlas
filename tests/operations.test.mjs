import test from 'node:test';
import assert from 'node:assert/strict';
import { smokeDeployment } from '../scripts/smoke-deployment.mjs';

const responses = () => new Map([
  ['/api/health', { status: 'ok' }], ['/api/ready', { status: 'ready' }],
  ['/api/seasons', { data: [{ year: 1950 }] }],
  ['/api/sources', { data: [{ slug: 'fixture', sha256: 'a'.repeat(64) }] }],
  ...['uk', 'en'].map(locale => [`/${locale}/seasons`, `<html lang="${locale}"><a href="/${locale}/seasons/1950">1950</a></html>`]),
]);
function requestFor(data, requests = []) {
  return async (url, options) => {
    requests.push({ url, options });
    const body = data.get(new URL(url).pathname);
    return typeof body === 'string' ? new Response(body) : Response.json(body);
  };
}

test('deployment smoke checks readiness, nonempty archive/provenance and both rendered locales', async () => {
  const requests = [];
  const result = await smokeDeployment('http://api.example', 'http://web.example', requestFor(responses(), requests));
  assert.equal(result.length, 6);
  assert.ok(result.every(row => row.status === 'passed'));
  assert.ok(requests.every(row => row.options.redirect === 'error' && row.options.signal instanceof AbortSignal));
});

test('deployment smoke rejects liveness-only, empty data, missing provenance and broken server-rendered pages', async () => {
  for (const [path, body, check] of [
    ['/api/ready', { status: 'not_ready' }, 'api_readiness'],
    ['/api/seasons', { data: [] }, 'api_archive'],
    ['/api/sources', { data: [] }, 'api_provenance'],
    ['/en/seasons', '<html lang="uk">error boundary</html>', 'web_en'],
  ]) {
    const data = responses(); data.set(path, body);
    await assert.rejects(smokeDeployment('http://api.example', 'http://web.example', requestFor(data)), new RegExp(check));
  }
  await assert.rejects(smokeDeployment('http://api.example', undefined, async () => new Response('secret-canary', { status: 503 })),
    { message: 'Deployment smoke failed: api_liveness' });
  await assert.rejects(smokeDeployment('http://api.example', undefined, async () => { throw new Error('secret-canary'); }),
    { message: 'Deployment smoke failed: api_liveness' });
});

test('deployment smoke rejects credential-bearing or ambiguous targets before making any request', async () => {
  for (const url of ['https://user:secret-canary@example.org', 'https://example.org/path', 'https://example.org/?token=secret-canary']) {
    await assert.rejects(smokeDeployment(url, undefined, () => assert.fail('must not fetch')), error =>
      /Smoke target must be/.test(error.message) && !error.message.includes('secret-canary'));
  }
});
