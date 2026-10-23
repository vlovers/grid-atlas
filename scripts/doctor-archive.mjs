#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { smokeDeployment } from './smoke-deployment.mjs';

/** Read-only diagnostics: validate deep dependencies, not just catalogue liveness. */
export async function doctorArchive(apiOrigin, request = fetch) {
  await smokeDeployment(apiOrigin, undefined, request);
  const results = [];
  const probe = async path => {
    const start = performance.now();
    try {
      const response = await request(new URL(path, apiOrigin), { signal: AbortSignal.timeout(8000), redirect: 'error', cache: 'no-store' });
      if (!response.ok) throw new Error();
      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error();
      results.push({ endpoint: path, status: 'passed', rows: payload.data.length, duration_ms: Math.round(performance.now() - start) });
      return payload.data;
    } catch { throw new Error(`Archive dependency failed: ${path}. Check API diagnostics, apply migrations and rerun the pinned import.`); }
  };
  const seasons = await probe('/api/seasons');
  const year = seasons.some(row => row.year === 2025) ? 2025 : seasons[0].year;
  for (const suffix of ['', '/races?limit=100', '/lineups', '/standings/drivers', '/standings/constructors']) await probe(`/api/seasons/${year}${suffix}`);
  for (const [kind, suffixes] of [['drivers', ['', '/identity', '/career', '/championships']], ['constructors', ['', '/identity', '/career', '/championships']], ['circuits', ['', '/identity', '/layouts', '/technical-history']], ['races', ['', '/results?limit=100']]]) {
    const rows = kind === 'races' ? await probe(`/api/seasons/${year}/races?limit=1`) : await probe(`/api/${kind}?limit=1`);
    if (!rows.length) throw new Error(`Archive has no ${kind}; complete the pinned import before accepting recovery.`);
    if (!/^[1-9][0-9]*$/.test(rows[0].id)) throw new Error('Archive returned an invalid canonical identity.');
    for (const suffix of suffixes) await probe(`/api/${kind}/${rows[0].id}${suffix}`);
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'api-origin': { type: 'string' } } });
    if (!values['api-origin']) throw new Error('Required: --api-origin');
    for (const row of await doctorArchive(values['api-origin'])) console.log(JSON.stringify(row));
  } catch (error) {
    const safe = /^(Archive dependency failed:|Archive has no |Archive returned|Deployment smoke failed:|Smoke target must be|Required:)/.test(error.message);
    console.error(JSON.stringify({ event: 'archive_doctor_failed', message: safe ? error.message : 'Invalid diagnostic arguments' }));
    process.exitCode = 1;
  }
}
