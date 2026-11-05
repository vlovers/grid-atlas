import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const chapters = JSON.parse(
  readFileSync(new URL('SIX_SINGLE_SOURCE_CHAPTERS_20261029.json', base), 'utf8'),
);
const ids = ['ain-diab', 'avus', 'bugatti', 'dijon', 'jacarepagua', 'zolder'];

test('six distinct circuit chapters integrate all 30 original bilingual scenes', () => {
  assert.equal(chapters.kind, 'integrated_sourced_circuit_manuscripts');
  assert.equal(chapters.human_approval, false);
  assert.equal(chapters.publication_allowed, false);
  assert.deepEqual(chapters.chapters.map((chapter) => chapter.circuit_id), ids);

  for (const chapter of chapters.chapters) {
    assert.deepEqual(chapter.integrated_scene_indices, [1, 2, 3, 4, 5]);
    assert.equal(chapter.human_approval, false);
    assert.equal(chapter.publication_allowed, false);
    assert.equal(chapter.verification_status, 'partial_fact_verification');
    assert.ok(chapter.pending_review.length >= 2, chapter.circuit_id);

    const original = JSON.parse(readFileSync(new URL(chapter.source_documents[0], base), 'utf8'));
    const source = original.circuits.find((circuit) => circuit.circuit_id === chapter.circuit_id);
    assert.ok(source, chapter.circuit_id);
    assert.equal(source.stories.length, 5, chapter.circuit_id);
    assert.deepEqual(source.stories.map((story) => story.story_index), [1, 2, 3, 4, 5]);
    assert.ok(source.stories.every((story) => story.publication === 'blocked'));

    const originalUrls = new Set(source.stories.flatMap((story) => story.source_urls));
    for (const url of originalUrls) {
      assert.ok(chapter.source_urls.includes(url), chapter.circuit_id + ': ' + url);
    }

    const domains = new Set(chapter.source_urls.map((url) => new URL(url).hostname));
    assert.ok(domains.size >= 2, chapter.circuit_id + ' needs an independent source domain');
    assert.equal(new Set(chapter.source_urls).size, chapter.source_urls.length);

    for (const locale of ['en', 'uk']) {
      assert.ok(chapter.title[locale].length >= 12, chapter.circuit_id);
      const paragraphs = chapter.article[locale].split('\n\n');
      assert.equal(paragraphs.length, 8, chapter.circuit_id + ':' + locale);
      assert.ok(chapter.article[locale].length >= 1000, chapter.circuit_id + ':' + locale);
      assert.equal(new Set(paragraphs).size, paragraphs.length, chapter.circuit_id + ':' + locale);
      assert.ok(paragraphs.every((paragraph) => paragraph.trim().length >= 60));
    }
  }
});

test('chapters are offline editorial drafts, never an approval or public release', () => {
  assert.equal(chapters.chapters.length * 5, 30);
  assert.ok(chapters.purpose.includes('independent editorial review'));
  assert.ok(chapters.chapters.every((chapter) =>
    chapter.human_approval === false && chapter.publication_allowed === false));
  assert.ok(chapters.chapters.every((chapter) =>
    chapter.pending_review.every((note) => typeof note === 'string' && note.length > 25)));
});
