import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const audit = read('docs/editorial/circuit-experience-v3/F1DB_78_CONTENT_COVERAGE_20261027.json');
const imported = read('docs/design/editorial-overhaul-circuits/coverage.json');
const next20 = read('docs/editorial/circuit-experience-v3/next20-f1db-layout-catalog-v1.json');
const next25 = read('docs/editorial/circuit-experience-v3/next25-research-leads.json');

test('78 pinned circuit identities each have a distinct bilingual short content entry, not a release approval', () => {
  const actual = audit.circuits.map(c => c.circuit_id).sort();
  const expected = imported.circuits.map(c => c.circuit_id).sort();
  assert.equal(new Set(actual).size, 78);
  assert.deepEqual(actual, expected);
  assert.equal(audit.summary.pinned_f1db_circuits, 78);
  assert.equal(audit.summary.distinct_circuit_ids_with_bilingual_short_content, 78);
  assert.ok(audit.circuits.every(c => c.short_entry_only && !c.publication_ready && !c.independent_editorial_approval));
  const releases = read('apps/web/src/components/editorial/circuit-release.json');
  assert.equal(releases.editions.length, 0);
  assert.equal(audit.summary.independently_approved_circuit_editions, 0);
  assert.equal(audit.summary.publication_ready_circuits, 0);
});

test('78 original short-entry sources remain stable as new full biographies are added', () => {
  const paths = [
    ['apps/web/src/components/editorial/circuit-extra-stories.json', 20],
    ['apps/web/src/components/editorial/circuit-next20-stories.json', 20],
    ['apps/web/src/components/editorial/circuit-final33-stories.json', 33],
  ];
  const sourceIds = new Map();
  for (const [path, count] of paths) {
    const raw = read(path);
    const entries = Array.isArray(raw) ? raw : raw.entries;
    assert.equal(entries.length, count, path);
    for (const entry of entries) {
      const id = entry.id ?? entry.circuit_id;
      assert.ok(!sourceIds.has(id), id);
      sourceIds.set(id, path);
    }
  }
  const narrativePath = 'apps/web/src/components/editorial/circuit-narratives-v3.json';
  const narrativeEntries = read(narrativePath).entries;
  const originalNarrativeIds = new Set(audit.circuits.filter(c => c.short_bilingual_content_source === narrativePath).map(c => c.circuit_id));
  assert.equal(originalNarrativeIds.size, 3);
  assert.ok(narrativeEntries.length >= originalNarrativeIds.size);
  assert.equal(new Set(narrativeEntries.map(e => e.circuit_id)).size, narrativeEntries.length);
  for (const id of originalNarrativeIds) {
    assert.ok(!sourceIds.has(id), id + ': original narrative should not duplicate short entry');
    assert.ok(narrativeEntries.some(e => e.circuit_id === id), id + ': missing original short entry');
    sourceIds.set(id, narrativePath);
  }
  for (const id of ['monaco', 'spa-francorchamps']) {
    assert.ok(!sourceIds.has(id));
    sourceIds.set(id, 'apps/web/src/components/editorial/circuit-history-stories.tsx');
  }
  assert.equal(sourceIds.size, 78);
  for (const entry of audit.circuits) {
    assert.equal(entry.short_bilingual_content_source, sourceIds.get(entry.circuit_id));
  }
});

test('45 five-story research dossiers are distinct and 33 other circuits remain outside those batches', () => {
  const first = new Set(next20.circuits.map(c => c.f1db_circuit_id));
  const second = new Set(next25.circuits.map(c => c.canonical_f1db_id));
  assert.equal(first.size, 20);
  assert.equal(second.size, 25);
  assert.ok([...first].every(id => !second.has(id)));
  assert.equal(audit.summary.distinct_circuits_with_five_story_research_dossiers, 45);
  assert.equal(audit.summary.without_five_story_research_dossiers, 33);
  for (const entry of audit.circuits) {
    const expected = first.has(entry.circuit_id) ? 'next20' : second.has(entry.circuit_id) ? 'next25' : null;
    assert.equal(entry.five_story_research_batch, expected, entry.circuit_id);
  }
  assert.equal(next25.circuits.filter(c => c.configuration_id === null).length, 25);
});
