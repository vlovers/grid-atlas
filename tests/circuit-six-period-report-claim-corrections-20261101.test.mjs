import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const doc = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/SIX_SINGLE_SOURCE_CHAPTERS_20261029.json', import.meta.url), 'utf8'));
const byId = new Map(doc.chapters.map(c => [c.circuit_id, c]));
const anchors = {
  'ain-diab': ['lap 30', '30-му колі'],
  avus: ['big-end bolt', 'болта шатуна'],
  bugatti: ['lap 23', '23-го кола'],
  dijon: ['first world-championship Grand Prix victory', 'першу перемогу'],
  jacarepagua: ['clutch problem', 'Проблеми зі зчепленням'],
  zolder: ['lap 36', '36-му колі'],
};

test('six period-report chronology corrections remain bilingual and blocked', () => {
  assert.equal(doc.chapters.length, 6);
  for (const [id, [en, uk]] of Object.entries(anchors)) {
    const chapter = byId.get(id);
    assert.ok(chapter, id);
    assert.ok(chapter.article.en.includes(en), id + ':en');
    assert.ok(chapter.article.uk.includes(uk), id + ':uk');
    for (const lang of ['en', 'uk']) {
      assert.equal(chapter.article[lang].split('\n\n').length, 8);
    }
    assert.deepEqual(chapter.integrated_scene_indices, [1, 2, 3, 4, 5]);
    assert.equal(chapter.human_approval, false);
    assert.equal(chapter.publication_allowed, false);
  }
  assert.equal(doc.human_approval, false);
  assert.equal(doc.publication_allowed, false);
});

test('a classification is not treated as evidence of an untroubled race or first turbo finish', () => {
  assert.doesNotMatch(byId.get('jacarepagua').article.en, /Prost's McLaren had been beaten on pace/);
  assert.doesNotMatch(byId.get('dijon').article.uk, /Жабуй першим довів до фінішу машину з турбодвигуном/);
  assert.ok(byId.get('bugatti').source_urls.includes('https://www.motorsportmagazine.com/archive/article/august-1967/36/the-53rd-grand-prix-of-france/'));
  assert.ok(byId.get('jacarepagua').source_urls.includes('https://www.motorsportmagazine.com/archive/article/may-1989/8/pride-of-italy/'));
});
