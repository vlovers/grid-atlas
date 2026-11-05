import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const files = [
  '../docs/editorial/circuit-experience-v3/FOUR_BREMGARTEN_ARGENTINA_MOSPORT_NIVELLES_INTEGRATED_20261029.json',
  '../docs/editorial/circuit-experience-v3/FOUR_MONSANTO_PORTO_PEDRALBES_MONT_TREMBLANT_INTEGRATED_20261029.json',
];

const manuscripts = files.map((path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')),
);
const chapters = new Map(manuscripts.flatMap((doc) => doc.chapters.map((chapter) => [chapter.circuit_id, chapter])));

test('eight historical chapters remain bilingual, source-linked and unpublished', () => {
  assert.equal(chapters.size, 8);
  for (const doc of manuscripts) {
    assert.equal(doc.human_approval, false);
    assert.equal(doc.publication_allowed, false);
    for (const chapter of doc.chapters) {
      assert.equal(chapter.human_approval, false, chapter.circuit_id);
      assert.equal(chapter.publication_allowed, false, chapter.circuit_id);
      assert.equal(chapter.verification_status, 'partial_fact_verification');
      assert.deepEqual(chapter.integrated_scene_indices, [1, 2, 3, 4, 5]);
      assert.ok(chapter.pending_review.length >= 2, chapter.circuit_id);
      assert.ok(new Set(chapter.source_urls.map((url) => new URL(url).hostname)).size >= 2);
      for (const locale of ['en', 'uk']) {
        const paragraphs = chapter.article[locale].split('\n\n');
        assert.equal(paragraphs.length, 8, chapter.circuit_id + ':' + locale);
        assert.ok(paragraphs.every((paragraph) => paragraph.length > 60));
      }
    }
  }
});

test('Argentina 1995 keeps the 71/72-lap source disagreement unresolved in both locales', () => {
  const chapter = chapters.get('buenos-aires');
  assert.match(chapter.article.en, /71 laps.*72 laps/s);
  assert.match(chapter.article.en, /period timing or stewards' documentation/);
  assert.match(chapter.article.uk, /71 коло.*72 кола/s);
  assert.match(chapter.article.uk, /протоколів хронометражу/);
});

test('Nivelles and Mont-Tremblant retain report-specific chronology, not just podiums', () => {
  const cases = [
    ['nivelles', ['lap 12', 'lap 26', 'lap 31', 'lap 58'], ['12-му колі', '26-му', '31-му', '58-го']],
    ['mont-tremblant', ['lap 12', 'lap 29', 'lap 39', '71 laps', 'final-drive'], ['12-му колі', '29-му колі', '39-го кола', '71 кола', 'головної передачі']],
  ];
  for (const [id, en, uk] of cases) {
    for (const [locale, anchors] of [['en', en], ['uk', uk]]) {
      for (const anchor of anchors) {
        assert.ok(chapters.get(id).article[locale].includes(anchor), id + ':' + locale + ':' + anchor);
      }
    }
  }
  assert.ok(chapters.get('nivelles').source_urls.includes('https://www.grandprix.com/races/belgian-gp-1972.html'));
});

test('closing paragraphs tell a race-specific story in both languages', () => {
  const anchors = {
    bremgarten: ['66-lap victory', 'Перемога після 66 кіл'],
    'buenos-aires': ['red flag', 'червоний прапор'],
    mosport: ['wet opening', 'мокрим стартом'],
    nivelles: ['first eight laps', 'Перші вісім кіл'],
    monsanto: ['at least a lap behind', 'щонайменше в коло'],
    porto: ['tram tracks and cobbles', 'Трамвайні рейки й бруківка'],
    pedralbes: ['windblown rubbish', 'принесене вітром сміття'],
    'mont-tremblant': ['reliability', 'надійності'],
  };
  for (const [id, [en, uk]] of Object.entries(anchors)) {
    assert.ok(chapters.get(id).article.en.split('\n\n')[7].includes(en), id + ':en');
    assert.ok(chapters.get(id).article.uk.split('\n\n')[7].includes(uk), id + ':uk');
  }
});
