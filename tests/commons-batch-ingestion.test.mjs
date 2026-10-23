import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ingestCommonsBatch } from '../scripts/ingest-commons-batch.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const ids = ['research-schumacher-portrait-2007', 'research-silverstone-2019'];
function fixtures(outputDir) {
  return {
    researchIds: [...ids], outputDir,
    staging: load('docs/media/cross-era-staging.json'),
    sourceEvidence: load('docs/media/commons-original-evidence.json'),
    candidates: load('docs/media/candidates.json'),
    publication: load('apps/web/src/components/media/publication.json'),
    pilot: load('docs/media/pilot-identities.json')
  };
}
const receipt = researchId => ({
  research_id: researchId, publication_allowed: false,
  source_evidence: { matched: true },
  local_original: { sha256: 'a'.repeat(64), sha1: 'b'.repeat(40), bytes: 123 },
  source_observation: { commons_file_page: 'https://commons.wikimedia.org/wiki/File:Test.jpg' }
});
async function inPrivateDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'grid-atlas-batch-ingest-'));
  try { await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('ingests sequentially, isolates candidate failure and never approves', async () => inPrivateDir(async dir => {
  const calls = [];
  const args = fixtures(dir);
  args.ingestImpl = async ({ researchId }) => {
    calls.push(researchId);
    if (researchId === ids[1]) throw Error('upstream unavailable');
    return receipt(researchId);
  };
  const result = await ingestCommonsBatch(args);
  assert.deepEqual(calls, ids);
  assert.equal(result.total, 2);
  assert.equal(result.ingested, 1);
  assert.equal(result.blocked, 1);
  assert.equal(result.publication_allowed, false);
  assert.equal(result.results[0].sha256, 'a'.repeat(64));
  assert.match(result.results[1].reason, /upstream unavailable/);
}));

test('rejects duplicate IDs before any download', async () => inPrivateDir(async dir => {
  const args = fixtures(dir);
  args.researchIds = [ids[0], ids[0]];
  args.ingestImpl = () => { throw Error('must not be called'); };
  await assert.rejects(() => ingestCommonsBatch(args), /distinct research IDs/);
}));

test('blocks unpinned IDs but continues valid candidates', async () => inPrivateDir(async dir => {
  const args = fixtures(dir);
  args.researchIds = ['research-ferrari-f2004-2004', ids[0]];
  const calls = [];
  args.ingestImpl = async ({ researchId }) => { calls.push(researchId); return receipt(researchId); };
  const result = await ingestCommonsBatch(args);
  assert.equal(result.blocked, 1);
  assert.equal(result.ingested, 1);
  assert.deepEqual(calls, [ids[0]]);
}));

test('fails closed if a staged candidate is accidentally approved', async () => inPrivateDir(async dir => {
  const args = fixtures(dir);
  args.staging.entries[0].status = 'verified';
  await assert.rejects(() => ingestCommonsBatch(args), /Staging integrity failed/);
}));

test('fails closed on duplicate source evidence', async () => inPrivateDir(async dir => {
  const args = fixtures(dir);
  args.sourceEvidence.entries.push({ ...args.sourceEvidence.entries[0] });
  await assert.rejects(() => ingestCommonsBatch(args), /Duplicate or invalid Commons evidence ID/);
}));

test('rejects symlink output directories', async () => inPrivateDir(async dir => {
  const link = join(dir, 'link');
  symlinkSync(dir, link);
  const args = fixtures(link);
  await assert.rejects(() => ingestCommonsBatch(args), /symlink/);
}));

test('rejects a downloader result without verified local SHA-256', async () => inPrivateDir(async dir => {
  const args = fixtures(dir);
  args.researchIds = [ids[0]];
  args.ingestImpl = async ({ researchId }) => ({ ...receipt(researchId), local_original: { sha256: 'bad' } });
  const result = await ingestCommonsBatch(args);
  assert.equal(result.ingested, 0);
  assert.equal(result.blocked, 1);
  assert.match(result.results[0].reason, /verified research-only original/);
}));
