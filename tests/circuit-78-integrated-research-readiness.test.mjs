import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = 'docs/editorial/circuit-experience-v3/';
const read = name => JSON.parse(readFileSync(root + name, 'utf8'));
const researchFiles = [
  'EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const queue = read('F1DB_78_RELEASE_WORKLIST.json');
const audit = read('F1DB_33_EXPANSION_SOURCE_TRIAGE_20261028.json');
const dossiers = researchFiles.flatMap(filename => {
  const file = read(filename);
  assert.equal(file.publication, 'blocked', filename);
  return file.circuits.map(circuit => ({ ...circuit, filename }));
});

test('all 165 research stories are bilingual, source-linked and unpublishable', () => {
  const ids = new Set(queue.batches.flatMap(batch => batch.circuit_ids));
  assert.equal(ids.size, 33);
  assert.equal(dossiers.length, 33);
  assert.equal(new Set(dossiers.map(c => c.circuit_id)).size, 33);
  assert.deepEqual(
    dossiers.map(c => c.circuit_id).sort(),
    [...ids].sort(),
  );
  let total = 0;
  for (const dossier of dossiers) {
    const queueRow = queue.circuits.find(c => c.circuit_id === dossier.circuit_id);
    assert.ok(queueRow, dossier.circuit_id);
    assert.equal(queueRow.five_story_research_batch?.startsWith('expansion-'), true);
    assert.equal(queueRow.publication, 'blocked');
    assert.equal(dossier.stories.length, 5);
    assert.deepEqual(dossier.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(dossier.stories.map(s => s.title.en)).size, 5);
    for (const story of dossier.stories) {
      total++;
      assert.equal(story.independent_approval, false, dossier.circuit_id);
      assert.equal(story.publication, 'blocked', dossier.circuit_id);
      assert.ok(Number.isInteger(story.year) && story.year >= 1950 && story.year <= 2026);
      for (const lang of ['en', 'uk']) {
        assert.ok(story.title[lang]?.trim().length > 10, dossier.circuit_id);
        assert.ok(story.narrative[lang]?.trim().length > 75, dossier.circuit_id);
      }
      assert.ok(story.source_urls?.length >= 1, dossier.circuit_id);
      for (const source of story.source_urls) {
        const parsed = new URL(source);
        assert.equal(parsed.protocol, 'https:');
        assert.ok(parsed.hostname.length > 3);
      }
    }
  }
  assert.equal(total, 165);
  assert.equal(queue.summary.publication_ready, 0);
  assert.equal(queue.summary.fully_editorially_approved, 0);
});

test('33-circuit source triage is reproducible and exposes single-source risks', () => {
  assert.equal(audit.summary.research_circuits, 33);
  assert.equal(audit.summary.research_stories, 165);
  assert.equal(audit.summary.publication_ready, 0);
  assert.equal(audit.circuits.length, 33);
  const byId = new Map(audit.circuits.map(c => [c.circuit_id, c]));
  assert.equal(byId.size, 33);
  const sourceUrls = new Set();
  let sourceReferences = 0;
  let singleSource = 0;
  for (const dossier of dossiers) {
    const row = byId.get(dossier.circuit_id);
    assert.ok(row, dossier.circuit_id);
    assert.equal(row.research_file, dossier.filename);
    assert.equal(row.story_count, 5);
    assert.equal(row.independent_approval, false);
    assert.equal(row.publication, 'blocked');
    assert.equal(row.claim_review, 'pending');
    assert.equal(row.bilingual_line_edit, 'pending');
    const urls = [...new Set(dossier.stories.flatMap(s => s.source_urls))];
    const years = [...new Set(dossier.stories.map(s => s.year))].sort((a, b) => a - b);
    assert.deepEqual(row.source_urls, urls);
    assert.deepEqual(row.distinct_story_years, years);
    assert.equal(row.unique_source_urls, urls.length);
    assert.equal(row.source_diversity_flag, urls.length === 1
      ? 'single_source_for_five_stories'
      : 'multiple_sources_not_independent_fact_check');
    if (urls.length === 1) singleSource++;
    dossier.stories.forEach(s => {
      sourceReferences += s.source_urls.length;
      s.source_urls.forEach(url => sourceUrls.add(url));
    });
  }
  assert.equal(audit.summary.single_source_circuits, singleSource);
  assert.equal(audit.summary.total_story_source_references, sourceReferences);
  assert.equal(audit.summary.distinct_source_urls, sourceUrls.size);
});
