import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, base), 'utf8'));

const oldIndex = read('CANONICAL_TWENTY_READER_CHAPTER_INDEX_20261029.json');
const six = read('SIX_SINGLE_SOURCE_CHAPTERS_20261029.json');
const seven = read('SEVEN_REMAINING_CIRCUIT_CHAPTERS_20261029.json');
const triage = read('F1DB_33_EXPANSION_SOURCE_TRIAGE_20261028.json');
const added = [...six.chapters, ...seven.chapters];

test('the 20 existing and 13 new bilingual chapters cover all 33 expansion circuits', () => {
  const originalIds = triage.circuits.map((circuit) => circuit.circuit_id);
  const existingIds = oldIndex.chapters.map((chapter) => chapter.circuit_id);
  const addedIds = added.map((chapter) => chapter.circuit_id);
  assert.equal(existingIds.length, 20);
  assert.equal(addedIds.length, 13);
  assert.equal(new Set([...existingIds, ...addedIds]).size, 33);
  assert.deepEqual([...existingIds, ...addedIds].sort(), [...originalIds].sort());
  assert.equal(added.length * 5, 65);
  assert.equal((existingIds.length + addedIds.length) * 5, 165);
  assert.equal(oldIndex.publication_allowed, false);
  assert.equal(six.publication_allowed, false);
  assert.equal(seven.publication_allowed, false);
});

test('13 new chapters are substantive bilingual editions with source provenance, not approvals', () => {
  for (const chapter of added) {
    assert.deepEqual(chapter.integrated_scene_indices, [1, 2, 3, 4, 5]);
    assert.equal(chapter.verification_status, 'partial_fact_verification');
    assert.equal(chapter.human_approval, false);
    assert.equal(chapter.publication_allowed, false);
    assert.ok(chapter.pending_review.length >= 2, chapter.circuit_id);
    assert.ok(chapter.pending_review.every((note) => note.length > 25));

    const original = read(chapter.source_documents[0]);
    const source = original.circuits.find((circuit) => circuit.circuit_id === chapter.circuit_id);
    assert.ok(source, chapter.circuit_id);
    assert.deepEqual(source.stories.map((story) => story.story_index), [1, 2, 3, 4, 5]);
    assert.ok(source.stories.every((story) => story.publication === 'blocked'));

    const sourceUrls = new Set(source.stories.flatMap((story) => story.source_urls));
    assert.ok([...sourceUrls].every((url) => chapter.source_urls.includes(url)), chapter.circuit_id);
    assert.equal(new Set(chapter.source_urls).size, chapter.source_urls.length);
    assert.ok(new Set(chapter.source_urls.map((url) => new URL(url).hostname)).size >= 2);

    for (const locale of ['en', 'uk']) {
      assert.ok(chapter.title[locale].length >= 12);
      const paragraphs = chapter.article[locale].split('\n\n');
      assert.equal(paragraphs.length, 8, chapter.circuit_id + ':' + locale);
      assert.ok(chapter.article[locale].length > 1000, chapter.circuit_id + ':' + locale);
      assert.equal(new Set(paragraphs).size, 8);
      assert.ok(paragraphs.every((paragraph) => paragraph.trim().length >= 60));
    }
  }
});

test('new manuscripts do not mutate the existing canonical twenty index', () => {
  assert.equal(oldIndex.total_chapters, 20);
  assert.equal(oldIndex.human_approval, false);
  assert.ok(oldIndex.chapters.every((chapter) =>
    chapter.publication_allowed === false && chapter.human_approval === false));
  assert.ok(added.every((chapter) => chapter.source_documents.length === 1));
});
