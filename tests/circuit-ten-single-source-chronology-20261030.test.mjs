import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chapters = JSON.parse(
  readFileSync(
    new URL('../apps/web/src/components/editorial/circuit-final33-stories.json', import.meta.url),
    'utf8',
  ),
);
const anchors = {
  bremgarten: ['Fangio was already clear', 'Фанхіо відірвався'],
  bugatti: ['both stopped with final-drive failures', 'обидва зійшли через поломки'],
  'clermont-ferrand': ['passed the Belgian only on the final lap', 'лише на останньому колі'],
  'east-london': ['missing locking washer', 'відсутню стопорну шайбу'],
  jacarepagua: ['gear selector jammed in first', 'заклинило на першій передачі'],
  jerez: ['1:21.072', '1:21,072'],
  monsanto: ['led all 62 laps', 'усі 62 кола'],
  nivelles: ['on lap nine', "на дев'ятому"],
  pedralbes: ["Ferrari's rear tyres", 'Задні покришки Ferrari'],
  'mont-tremblant': ['lap 71', '71-му колі'],
};

test('ten formerly single-source circuit cards carry sourced bilingual race chronology, without approval', () => {
  assert.equal(Object.keys(anchors).length, 10);
  for (const [id, [en, uk]] of Object.entries(anchors)) {
    const card = chapters.find(chapter => chapter.id === id);
    assert.ok(card, id);
    assert.ok(card.description.en.includes(en), id + '/en chronology');
    assert.ok(card.description.uk.includes(uk), id + '/uk chronology');
    assert.ok(card.description.en.includes('\n\n'), id + '/en paragraph');
    assert.ok(card.description.uk.includes('\n\n'), id + '/uk paragraph');
    assert.ok(card.historical_sources.length >= 1, id + '/historical source');
    assert.ok(card.source.startsWith('https://'), id + '/classification source');
    assert.match(card.historical_source_locator, /independent claim approval pending/);
    assert.notEqual(card.human_approval, true, id + '/human review');
    assert.notEqual(card.publication_allowed, true, id + '/publication');
  }
  for (const id of ['bugatti', 'jacarepagua', 'nivelles']) {
    const card = chapters.find(chapter => chapter.id === id);
    assert.ok(card.historical_sources.length >= 2, id + '/independent corroboration');
  }
});
