import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, base), 'utf8'));
const six = read('SIX_SINGLE_SOURCE_CHAPTERS_20261029.json');
const seven = read('SEVEN_REMAINING_CIRCUIT_CHAPTERS_20261029.json');
const chapters = [...six.chapters, ...seven.chapters];

const finalSceneAnchors = {
  'ain-diab': ['Lewis-Evans', 'Льюїса-Еванса'],
  avus: ['support race', 'гонці підтримки'],
  bugatti: ['24-hour race', '24-годинної гонки'],
  dijon: ['0.240', '0,240'],
  jacarepagua: ['61 racing laps', '61 гоночне коло'],
  zolder: ["Tyrrell's later exclusion", 'виключення Tyrrell'],
  aida: ['second drivers', 'другий чемпіонський'],
  aintree: ['team orders', 'командну тактику'],
  'caesars-palace': ['Piquet and Rosberg', 'п\'яте місце'],
  madring: ['Virtual Safety Car', 'VSC'],
  reims: ['Herrmann', 'Геррманна'],
  riverside: ['fuel flare-ups', 'спалахів пального'],
  'spa-francorchamps': ["Stewart's wrecked BRM", 'BRM Стюарта'],
};

test('thirteen revised bilingual chapters retain distinct scene and consequence endings', () => {
  assert.equal(chapters.length, 13);
  assert.equal(new Set(chapters.map((chapter) => chapter.circuit_id)).size, 13);
  for (const chapter of chapters) {
    const anchors = finalSceneAnchors[chapter.circuit_id];
    assert.ok(anchors, chapter.circuit_id);
    for (const [index, locale] of ['en', 'uk'].entries()) {
      const paragraphs = chapter.article[locale].split('\n\n');
      assert.equal(paragraphs.length, 8, chapter.circuit_id + ':' + locale);
      assert.ok(paragraphs[3].split(/\s+/).length >= 35, chapter.circuit_id + ':' + locale);
      assert.ok(paragraphs[7].split(/\s+/).length >= 35, chapter.circuit_id + ':' + locale);
      assert.ok(paragraphs[7].includes(anchors[index]), chapter.circuit_id + ':' + locale);
      assert.notEqual(paragraphs[0], paragraphs[7], chapter.circuit_id + ':' + locale);
    }
    assert.equal(chapter.human_approval, false, chapter.circuit_id);
    assert.equal(chapter.publication_allowed, false, chapter.circuit_id);
    assert.equal(chapter.verification_status, 'partial_fact_verification', chapter.circuit_id);
  }
});

test('Madring VSC sequence has independent race narrative and official result provenance', () => {
  const madrid = chapters.find((chapter) => chapter.circuit_id === 'madring');
  assert.ok(madrid);
  assert.ok(madrid.source_urls.includes('https://api.fia.com/news/f1-antonelli-wins-spanish-grand-ahead-verstappen-vsc-costs-norris'));
  assert.ok(madrid.source_urls.includes('https://www.formula1.com/en/results/2026/races/1294/madrid/race-result'));
  assert.ok(madrid.source_urls.includes('https://www.grandprix.com/races/spanish-gp-2026-race-notes.html'));
  assert.ok(madrid.pending_review.some((note) => note.includes('Claim locator') && note.includes('not human approval')));
  assert.match(madrid.article.en, /Norris came home third, 0\.738 seconds behind Verstappen/);
  assert.match(madrid.article.uk, /Норріс фінішував третім, за 0,738 секунди/);
  assert.equal(madrid.human_approval, false);
  assert.equal(madrid.publication_allowed, false);
});
