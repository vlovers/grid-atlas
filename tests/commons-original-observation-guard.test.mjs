import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expectedObservedSha256 } from '../scripts/commons-original-observation-guard.mjs';
import { ingestCommonsBatch } from '../scripts/ingest-commons-batch.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const id = 'research-schumacher-portrait-2007';
const base = () => ({
  staging: load('docs/media/cross-era-staging.json'),
  sourceEvidence: load('docs/media/commons-original-evidence.json'),
  originalObservations: load('docs/media/verified-original-observations.json'),
  candidates: load('docs/media/candidates.json'),
  publication: load('apps/web/src/components/media/publication.json'),
  pilot: load('docs/media/pilot-identities.json')
});

test('only two original binaries have pinned SHA-256 observations; pending remain unapproved', () => {
  const args = base();
  const known = args.originalObservations.entries[0];
  assert.equal(expectedObservedSha256({ researchId: known.research_id, ...args }), known.sha256);
  assert.equal(expectedObservedSha256({ researchId: 'research-silverstone-2019', ...args }), null);
  assert.equal(args.originalObservations.publication_allowed, false);
});

test('refuses forged original observations, source identity drift and duplicate hashes', () => {
  const mutations = [
    args => { args.originalObservations.entries[0].sha256 = 'bad'; },
    args => { args.originalObservations.entries[0].bytes += 1; },
    args => { args.originalObservations.entries[0].sha1 = 'f'.repeat(40); },
    args => { args.originalObservations.entries[1].sha256 = args.originalObservations.entries[0].sha256; },
    args => { args.originalObservations.entries.push({ ...args.originalObservations.entries[0] }); },
    args => { args.originalObservations.entries[0].research_id = 'research-not-pinned'; },
    args => { args.originalObservations.publication_allowed = true; },
    args => { args.originalObservations.source_run_url = 'https://example.org/forged'; },
    args => { args.originalObservations.observed_on = '2026-02-30'; }
  ];
  for (const mutate of mutations) {
    const args = base(); mutate(args);
    assert.throws(() => expectedObservedSha256({ researchId: id, ...args }));
  }
});

test('batch rejects an invented SHA-256 from a mock ingestion handoff', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'grid-atlas-sha256-guard-'));
  try {
    const args = base();
    const source = args.sourceEvidence.entries.find(x => x.research_id === id);
    const candidate = args.staging.entries.find(x => x.id === id);
    let called = 0;
    const batch = await ingestCommonsBatch({
      ...args, researchIds: [id], outputDir: dir,
      ingestImpl: async () => {
        called++;
        return {
          research_id: id, publication_allowed: false,
          source_file_page: source.file_page_url,
          source_evidence: { matched: true },
          local_original: { sha256: 'a'.repeat(64), sha1: source.sha1, bytes: source.bytes,
            mime: candidate.image.mime, width: source.width, height: source.height },
          source_observation: { commons_file_page: source.file_page_url }
        };
      }
    });
    assert.equal(called, 1);
    assert.equal(batch.ingested, 0);
    assert.equal(batch.blocked, 1);
    assert.match(batch.results[0].reason, /differs from pinned original observation/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('batch fails on invalid observation register before calling any downloader', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'grid-atlas-sha256-guard-'));
  try {
    const args = base();
    args.originalObservations.entries[0].sha1 = '0'.repeat(40);
    let calls = 0;
    await assert.rejects(() => ingestCommonsBatch({
      ...args, researchIds: [id], outputDir: dir,
      ingestImpl: async () => { calls++; throw Error('must not run'); }
    }), /Unpinned, conflicting or duplicate/);
    assert.equal(calls, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
