import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const path = new URL('../docs/editorial/circuit-experience-v3/FOUR_BREMGARTEN_ARGENTINA_MOSPORT_NIVELLES_INTEGRATED_20261029.json', import.meta.url);
const data = JSON.parse(readFileSync(path, 'utf8'));
const chapters = new Map(data.chapters.map((chapter) => [chapter.circuit_id, chapter]));

test('four canonical chapters keep their five-scene bilingual draft boundary', () => {
  assert.deepEqual([...chapters.keys()].sort(), ['bremgarten', 'buenos-aires', 'mosport', 'nivelles']);
  assert.equal(data.publication_allowed, false);
  assert.equal(data.human_approval, false);
  for (const chapter of chapters.values()) {
    assert.deepEqual(chapter.integrated_scene_indices, [1, 2, 3, 4, 5]);
    assert.equal(chapter.verification_status, 'partial_fact_verification');
    assert.equal(chapter.human_approval, false);
    assert.equal(chapter.publication_allowed, false);
    assert.ok(chapter.pending_review.length >= 2);
    assert.ok(chapter.pending_review.every((note) => note.length > 30));
    assert.ok(new Set(chapter.source_urls.map((url) => new URL(url).hostname)).size >= 2);
    assert.equal(new Set(chapter.source_urls).size, chapter.source_urls.length);
    for (const locale of ['en', 'uk']) {
      const paragraphs = chapter.article[locale].split('\n\n');
      assert.equal(paragraphs.length, 8, chapter.circuit_id + ':' + locale);
      assert.ok(chapter.article[locale].length >= 1000);
      assert.ok(paragraphs.every((paragraph) => paragraph.trim().length > 60));
      assert.equal(new Set(paragraphs).size, 8);
    }
  }
});

test('Buenos Aires explicitly separates official classification from period reporting', () => {
  const chapter = chapters.get('buenos-aires');
  for (const [locale, anchors] of Object.entries({
    en: ['71 laps', '7.136', '32.888', '72 laps', 'restart', 'Coulthard'],
    uk: ['71 коло', '7,136', '32,888', '72 кола', 'повторний старт', 'Култгард'],
  })) {
    for (const anchor of anchors) {
      assert.ok(chapter.article[locale].includes(anchor), locale + ': ' + anchor);
    }
  }
  assert.ok(chapter.source_urls.some((url) => url.includes('formula1.com/en/results/1995')));
  assert.ok(chapter.source_urls.some((url) => url.includes('motorsportmagazine.com/archive/article/may-1995')));
});

test('four historical turning points remain in both language editions', () => {
  const anchors = {
    bremgarten: [['González', '66 laps', 'second World Drivers'], ['Гонсалес', '66 кіл', 'другий титул']],
    mosport: [['lap 58', 'ignition', 'Brabham'], ['58-му колі', 'запалювання', 'Бребем']],
    nivelles: [['lap nine', 'Regazzoni', '1974'], ["дев'ятому колі", 'Регаццоні', '1974']],
  };
  for (const [id, [en, uk]] of Object.entries(anchors)) {
    for (const [locale, expected] of [['en', en], ['uk', uk]]) {
      for (const fragment of expected) {
        assert.ok(chapters.get(id).article[locale].includes(fragment), id + ':' + locale + ':' + fragment);
      }
    }
  }
});
