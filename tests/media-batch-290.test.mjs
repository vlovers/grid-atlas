import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadBatch, originalInputs, resolveBatch, readPrivateOriginal } from '../scripts/media-batch-290.mjs';
import { parseMediaRegistry, selectMediaCollection } from '../apps/web/src/components/media/registry.ts';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const batch = read('docs/media/batch-290.json');
const paths = [...new Set(batch.entries.map(row => row.registry))];
const registries = Object.fromEntries(paths.map(path => [path, read(path)]));
const identities = read('docs/media/pilot-identities.json');

test('twelve distinct batch references reuse seven existing candidates; all remain unpublished', () => {
  const rows = loadBatch();
  assert.equal(rows.length, 12);
  assert.equal(rows.filter(row => row.task.registry === 'docs/media/batch-290-new-candidates.json').length, 5);
  const added = read('docs/media/batch-290-new-candidates.json');
  assert.equal(parseMediaRegistry(added, identities.subjects, '2026-10-28', 'candidates').assets.length, 5);
  for (const { candidate, task } of rows) {
    assert.equal(candidate.review, null);
    assert.deepEqual(candidate.delivery, { local_path: null, remote_url: null });
    assert.deepEqual(selectMediaCollection([candidate], candidate.subject), []);
    assert.ok(task.proposed.alt.en && task.proposed.alt.uk && task.proposed.caption.en && task.proposed.caption.uk);
  }
  assert.deepEqual(read('apps/web/src/components/media/publication.json').assets, []);
});

test('batch refuses duplicate, swapped, unpinned and accidentally approved candidates', () => {
  for (const mutate of [
    b => { b.publication_allowed = true; },
    b => { b.entries[1] = structuredClone(b.entries[0]); },
    b => { b.entries[0].registry = '../../private.json'; },
    b => { b.entries[0].source_observation.file_page_url = b.entries[1].source_observation.file_page_url; },
    b => { b.entries[0].source_observation.sha1 = 'invalid'; },
    b => { b.entries[0].proposed.alt.uk = ''; },
  ]) {
    const value = structuredClone(batch); mutate(value);
    assert.throws(() => resolveBatch(value, registries, identities));
  }
  const changed = structuredClone(registries);
  changed[batch.entries[0].registry].entries[0].review = { actor: 'human' };
  assert.throws(() => resolveBatch(batch, changed, identities), /publication boundary/);
  assert.throws(() => resolveBatch(batch, registries, { subjects: [] }), /Unpinned/);
});

test('original adapter preserves exact dimensions and source pins for existing structural inspector', () => {
  const inputs = originalInputs(loadBatch());
  for (const [index, entry] of inputs.staging.entries.entries()) {
    const pin = batch.entries[index].source_observation;
    assert.deepEqual(entry.image, { mime: pin.mime, width: pin.width, height: pin.height });
    assert.equal(inputs.sourceEvidence.entries[index].sha1, pin.sha1);
    assert.equal(entry.review, null);
    assert.deepEqual(entry.delivery, { local_path: null, remote_url: null });
  }
});

test('private original reader denies traversal, unknown files, malformed bytes and repository directory', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grid-atlas-media290-test-'));
  try {
    assert.throws(() => readPrivateOriginal('../publication', dir), /Unknown private/);
    assert.throws(() => readPrivateOriginal('research-unknown', dir), /Unknown private/);
    const id = originalInputs(loadBatch()).staging.entries[0].id;
    writeFileSync(join(dir, id + '.jpg'), 'not an image');
    assert.throws(() => readPrivateOriginal(id, dir), /size mismatch/);
    assert.throws(() => readPrivateOriginal(id, process.cwd()));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('current media audit validates the new candidate lane and distinguishes twelve tasks from approvals', async () => {
  const { mediaReadinessReport } = await import('../scripts/audit-media-readiness.mjs');
  const report = mediaReadinessReport('2026-10-28');
  assert.equal(report.approved_publication_assets, 0);
  assert.deepEqual(report.research_batches, [{ issue: 290, distinct_candidates: 12, reused_candidates: 7, new_candidates: 5, publication_allowed: false, prior_original_sha256_observations: 2, newly_verified_originals: 0, independent_approvals: 0 }]);
});
