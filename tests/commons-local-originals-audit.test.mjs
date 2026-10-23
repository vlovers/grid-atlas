import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditLocalCommonsOriginals } from '../scripts/audit-local-commons-originals.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const fixtures = outputDir => ({
  outputDir,
  staging: load('docs/media/cross-era-staging.json'),
  sourceEvidence: load('docs/media/commons-original-evidence.json'),
  observations: load('docs/media/verified-original-observations.json')
});
async function withDirectory(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'grid-atlas-local-originals-'));
  try { await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}
function touchCandidate(dir, args, id) {
  const item = args.staging.entries.find(entry => entry.id === id);
  const ext = item.image.mime === 'image/png' ? '.png' : '.jpg';
  writeFileSync(join(dir, id + ext), 'mocked inspection; no image bytes');
}
function verifiedInspection(args, id) {
  const item = args.staging.entries.find(entry => entry.id === id);
  const source = args.sourceEvidence.entries.find(entry => entry.research_id === id);
  const previous = args.observations.entries.find(entry => entry.research_id === id);
  return {
    research_id: id, publication_allowed: false, source_file_page: source.file_page_url,
    source_evidence: { matched: true },
    local_original: {
      sha256: previous?.sha256 ?? 'b'.repeat(64), sha1: source.sha1, bytes: source.bytes,
      width: source.width, height: source.height, mime: item.image.mime
    }
  };
}

test('reports all five pending without pretending originals were inspected', async () => withDirectory(async dir => {
  const args = fixtures(dir);
  const report = auditLocalCommonsOriginals({ ...args, inspectImpl: () => { throw Error('must not inspect'); } });
  assert.equal(report.ok, true);
  assert.equal(report.complete, false);
  assert.equal(report.pending, 5);
  assert.equal(report.inspected, 0);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.results.filter(row => row.previously_observed_sha256).length, 2);
}));

test('reconciles prior SHA-256 and labels new original hashes without approving rights', async () => withDirectory(async dir => {
  const args = fixtures(dir);
  const previousId = args.observations.entries[0].research_id;
  const newId = args.staging.entries.find(entry => !args.observations.entries.some(receipt => receipt.research_id === entry.id)).id;
  touchCandidate(dir, args, previousId);
  touchCandidate(dir, args, newId);
  const report = auditLocalCommonsOriginals({
    ...args, inspectImpl: ({ researchId }) => verifiedInspection(args, researchId)
  });
  assert.equal(report.inspected, 2);
  assert.equal(report.pending, 3);
  assert.equal(report.complete, false);
  assert.equal(report.blocked, 0);
  assert.equal(report.results.find(row => row.research_id === previousId).status, 'matched_prior_sha256');
  const fresh = report.results.find(row => row.research_id === newId);
  assert.equal(fresh.status, 'inspected_new_sha256');
  assert.equal(fresh.sha256, 'b'.repeat(64));
  assert.equal(fresh.rights_review, 'pending');
  assert.equal(report.publication_allowed, false);
}));

test('blocks changed bytes relative to a previously observed SHA-256', async () => withDirectory(async dir => {
  const args = fixtures(dir);
  const id = args.observations.entries[0].research_id;
  touchCandidate(dir, args, id);
  const report = auditLocalCommonsOriginals({
    ...args, inspectImpl: ({ researchId }) => ({
      ...verifiedInspection(args, researchId),
      local_original: { ...verifiedInspection(args, researchId).local_original, sha256: 'c'.repeat(64) }
    })
  });
  assert.equal(report.ok, false);
  assert.equal(report.blocked, 1);
  assert.match(report.results.find(row => row.research_id === id).reason, /differs from prior verified observation/);
}));

test('rejects forged, duplicate or unpinned observation receipts', async () => withDirectory(async dir => {
  for (const mutate of [
    args => { args.observations.entries[0].sha256 = 'invalid'; },
    args => { args.observations.entries[0].sha1 = '0'.repeat(40); },
    args => { args.observations.entries.push({ ...args.observations.entries[0] }); },
    args => { args.observations.entries[0].research_id = 'research-unknown'; }
  ]) {
    const args = fixtures(dir);
    mutate(args);
    assert.throws(() => auditLocalCommonsOriginals(args), /Invalid, duplicate or unpinned/);
  }
}));

test('rejects staged identity drift and refuses symlink originals', async () => withDirectory(async dir => {
  const args = fixtures(dir);
  args.staging.entries[0].file_page_url = 'https://commons.wikimedia.org/wiki/File:Wrong.jpg';
  assert.throws(() => auditLocalCommonsOriginals(args), /Staging or source evidence mismatch/);
  const clean = fixtures(dir);
  const id = clean.staging.entries[0].id;
  symlinkSync(join(dir, 'nonexistent'), join(dir, id + '.jpg'));
  const report = auditLocalCommonsOriginals({
    ...clean,
    inspectImpl: ({ filePath }) => { throw Error('Symlink original rejected: ' + filePath); }
  });
  assert.equal(report.ok, false);
  assert.equal(report.blocked, 1);
}));
