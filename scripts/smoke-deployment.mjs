#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

function origin(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error('Smoke target must be an HTTP(S) origin without credentials, path, query or fragment'); }
}

/** Read-only probes; empty catalogues fail the release-data gate. No retries hide failures. */
export async function smokeDeployment(apiOrigin, webOrigin, request = fetch) {
  const api = origin(apiOrigin);
  const web = webOrigin === undefined ? undefined : origin(webOrigin);
  const checks = [
    ['api_liveness', `${api}/api/health`, 'json', data => data?.status === 'ok'],
    ['api_readiness', `${api}/api/ready`, 'json', data => data?.status === 'ready'],
    ['api_archive', `${api}/api/seasons`, 'json', data => Array.isArray(data?.data) &&
      data.data.length > 0 && data.data.every(row => Number.isInteger(row.year) && row.year >= 1950 && row.year <= 2200)],
    ['api_provenance', `${api}/api/sources`, 'json', data => Array.isArray(data?.data) &&
      data.data.length > 0 && data.data.every(row => typeof row.slug === 'string' && row.slug.length > 0 &&
        typeof row.sha256 === 'string' && /^[a-f0-9]{64}$/.test(row.sha256))],
  ];
  if (web) for (const locale of ['uk', 'en']) {
    checks.push([`web_${locale}`, `${web}/${locale}/seasons`, 'text', html =>
      new RegExp(`<html[^>]+lang="${locale}"`).test(html) &&
      new RegExp(`href="/${locale}/seasons/[0-9]{4}"`).test(html)]);
  }
  const results = [];
  for (const [check, url, format, valid] of checks) {
    const started = performance.now();
    try {
      const response = await request(url, { signal: AbortSignal.timeout(8000), redirect: 'error', cache: 'no-store' });
      if (response.status !== 200 || !valid(await response[format]())) throw new Error();
    } catch { throw new Error(`Deployment smoke failed: ${check}`); }
    results.push({ check, status: 'passed', duration_ms: Math.round(performance.now() - started) });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'api-origin': { type: 'string' }, 'web-origin': { type: 'string' } } });
    if (!values['api-origin']) throw new Error('Required: --api-origin (optional: --web-origin)');
    for (const result of await smokeDeployment(values['api-origin'], values['web-origin'])) console.log(JSON.stringify(result));
  } catch (error) {
    // Parse errors may contain arbitrary CLI values; emit only controlled messages.
    const message = error.message.startsWith('Deployment smoke failed:') ||
      error.message.startsWith('Smoke target must be') || error.message.startsWith('Required:')
      ? error.message : 'Invalid smoke arguments';
    console.error(JSON.stringify({ event: 'smoke_failed', message }));
    process.exitCode = 1;
  }
}
