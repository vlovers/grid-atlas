import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const files = [
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const byId = new Map(files.flatMap((name) =>
  JSON.parse(readFileSync(new URL(name, root), 'utf8')).circuits.map((c) => [c.circuit_id, c])));
const anchors = {
  aintree: [['lap 26', '26-му колі'], ['Behra', 'Бера'], ['lap 69', '69-му колі'], ['Hawthorn', 'Готорн'], ['clutch', 'зчеплення']],
  avus: [['two heats', 'два заїзди по 30'], ['1.9 seconds', '1,9 секунди'], ['rev counter', 'тахометр'], ['transfer gears', 'шестерні'], ['second lap', 'другому колі']],
  dijon: [['lap 46', '46-му колі'], ['0.240 seconds', '0,240 секунди'], ['right leg', 'права нога'], ['lap 53', '53-му колі'], ['lap 24', '24-му колі']],
  montjuic: [['later Guardian obituary reports four', 'пізніший Guardian'], ['4.5', '4,5'], ['0.5', '0,5'], ['lap 28', '28-му колі'], ['pole', 'поул']],
  nivelles: [['lap nine', 'дев\'ятому колі'], ['lap 31', '31-му колі'], ['lap 58', '58-му колі'], ['Carlos Pace', 'Карлоса Паче'], ['lap 66', '66-му колі']],
};
test('25 period-source EN/UK scenes preserve chronology and publication gates', () => {
  let count = 0;
  for (const [id, sceneAnchors] of Object.entries(anchors)) {
    const circuit = byId.get(id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map(s => s.story_index), [1,2,3,4,5]);
    for (const [i, s] of circuit.stories.entries()) {
      count++;
      for (const locale of ['en','uk']) {
        assert.ok(s.narrative[locale].length >= (locale === 'en' ? 260 : 240), id + '/' + locale);
        assert.ok(s.narrative[locale].trim().split(/\s+/).length >= (locale === 'en' ? 55 : 45), id + '/' + locale + ' words');
      }
      assert.ok(s.narrative.en.includes(sceneAnchors[i][0]), id + ':en:' + (i+1));
      assert.ok(s.narrative.uk.includes(sceneAnchors[i][1]), id + ':uk:' + (i+1));
      assert.ok(s.source_urls.some(url => url.includes('formula1.com/en/results/')));
      assert.ok(s.historical_sources.some(url => url.includes('motorsportmagazine.com')));
      assert.ok(s.historical_sources.every(url => !s.source_urls.includes(url)));
      assert.match(s.historical_source_locator, id === 'montjuic' ? /classification, not casualty counts.*review pending/i : /classification remains separate; claim-level source review pending/);
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
      assert.equal(s.independent_approval, false);
      assert.equal(s.publication, 'blocked');
    }
  }
  assert.equal(count,25);
  for (const id of ['dijon','montjuic','nivelles']) {
    assert.ok(byId.get(id).stories.every(s => s.historical_sources.some(url => url.includes('grandprix.com'))),id);
  }
});
