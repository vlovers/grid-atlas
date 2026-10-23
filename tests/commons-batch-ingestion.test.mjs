import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestCommonsBatch } from '../scripts/ingest-commons-batch.mjs';
import { buildCommonsResearchReport } from '../scripts/build-commons-research-report.mjs';

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
const receipt = researchId => {
  const source = load('docs/media/commons-original-evidence.json').entries.find(item => item.research_id === researchId);
  const candidate = load('docs/media/cross-era-staging.json').entries.find(item => item.id === researchId);
  return {
    research_id: researchId, publication_allowed: false,
    source_file_page: source.file_page_url,
    source_evidence: { matched: true },
    local_original: {
      sha256: 'a'.repeat(64), sha1: source.sha1, bytes: source.bytes,
      mime: candidate.image.mime, width: source.width, height: source.height
    },
    source_observation: {
      commons_file_page: source.file_page_url,
      api_original_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/test.jpg',
      api_timestamp: '2026-10-23T00:00:00Z'
    }
  };
};
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
  // Simulate an otherwise valid staged candidate whose Commons original is not pinned.
  args.sourceEvidence.entries = args.sourceEvidence.entries.filter(item => item.research_id !== 'research-ferrari-f2004-2004');
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


test('batch ingestion refuses a public repository destination before processing any candidate', async () => {
  const outputDir = fileURLToPath(new URL('../apps/web/public/', import.meta.url));
  const args = fixtures(outputDir);
  let calls = 0;
  args.ingestImpl = async () => { calls++; throw Error('must not download'); };
  await assert.rejects(() => ingestCommonsBatch(args), /outside the repository/);
  assert.equal(calls, 0);
});

test('all five verified batch inspections produce a complete research-only receipt', async () => inPrivateDir(async dir => {
  const args = fixtures(dir);
  args.researchIds = args.staging.entries.map(entry => entry.id);
  args.ingestImpl = async ({ researchId }) => receipt(researchId);
  const batch = await ingestCommonsBatch(args);
  assert.equal(batch.ingested, 5);
  assert.equal(batch.blocked, 0);
  assert.ok(batch.results.every(row => row.mime && row.width > 0 && row.height > 0));
  const report = buildCommonsResearchReport(batch, args.sourceEvidence, args.staging);
  assert.equal(report.total, 5);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.original_files_in_report, false);
  assert.ok(report.entries.every(row => row.rights_review === 'pending' && row.subject_review === 'pending'));
}));

test('rejects forged inspected provenance, MIME, dimensions and source checksum before receipt creation', async () => inPrivateDir(async dir => {
  for (const mutate of [
    row => { row.source_file_page = 'https://commons.wikimedia.org/wiki/File:Other.jpg'; },
    row => { row.local_original.sha1 = '0'.repeat(40); },
    row => { row.local_original.bytes += 1; },
    row => { row.local_original.mime = 'image/png'; },
    row => { row.local_original.width += 1; },
    row => { row.local_original.height += 1; },
    row => { row.source_observation.commons_file_page = 'https://commons.wikimedia.org/wiki/File:Other.jpg'; }
  ]) {
    const args = fixtures(dir);
    args.researchIds = [ids[0]];
    args.ingestImpl = async ({ researchId }) => {
      const row = receipt(researchId);
      mutate(row);
      return row;
    };
    const batch = await ingestCommonsBatch(args);
    assert.equal(batch.ingested, 0);
    assert.equal(batch.blocked, 1);
    assert.match(batch.results[0].reason, /verified research-only original/);
  }
}));
