import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = path => JSON.parse(readFileSync(path, 'utf8'));
const coverage = load('docs/editorial/circuit-experience-v3/F1DB_78_CONTENT_COVERAGE_20261027.json');
const queue = load('docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json');

const expansionIds = new Map(queue.batches.flatMap(batch =>
  batch.circuit_ids.map(id => [id, batch.id])
));

test('all 78 circuit dossiers are accounted for, while all publication gates stay closed', () => {
  assert.equal(queue.summary.total, 78);
  assert.equal(queue.summary.short_bilingual_entries, 78);
  assert.equal(queue.circuits.length, coverage.circuits.length);
  assert.equal(new Set(queue.circuits.map(row => row.circuit_id)).size, 78);
  assert.deepEqual(queue.circuits.map(row => row.circuit_id), coverage.circuits.map(row => row.circuit_id));

  for (let i = 0; i < queue.circuits.length; i++) {
    const row = queue.circuits[i];
    const original = coverage.circuits[i];
    const expansion = expansionIds.get(row.circuit_id);
    assert.equal(row.short_content_source, original.short_bilingual_content_source);
    assert.equal(row.five_story_research_batch, expansion ?? original.five_story_research_batch);
    assert.equal(row.content_stage, 'five_story_research_dossier_draft');
    assert.equal(row.expansion_batch, expansion ?? null);
    assert.equal(row.publication, 'blocked');
    for (const key of [
      'independent_claim_check',
      'historical_layout_check',
      'turn_names_and_numbers_check',
      'photo_rights_check',
      'bilingual_line_edit',
    ]) {
      assert.equal(row[key], 'pending');
    }
  }
  assert.equal(queue.summary.five_story_dossier_drafts, 78);
  assert.equal(queue.summary.requires_five_story_expansion, 0);
  assert.equal(queue.summary.research_dossiers_added_in_expansions, 33);
  assert.equal(queue.summary.research_stories_added_in_expansions, 165);
  assert.equal(queue.summary.publication_ready, 0);
  assert.equal(queue.summary.fully_editorially_approved, 0);
});

test('the original 33 missing dossiers now map exactly to three complete research batches', () => {
  const missingAtAudit = coverage.circuits
    .filter(row => row.five_story_research_batch === null)
    .map(row => row.circuit_id).sort();
  const expanded = [...expansionIds.keys()].sort();
  assert.deepEqual(expanded, missingAtAudit);
  assert.equal(expansionIds.size, 33);
  assert.equal(queue.batches.length, 3);
  for (const batch of queue.batches) {
    assert.equal(batch.circuit_ids.length, 11);
    assert.equal(batch.expected_circuits, 11);
    assert.equal(batch.research_dossiers_present, 11);
    assert.equal(batch.publication, 'blocked');
    assert.ok(batch.acceptance.includes('provenance'));
  }
});
