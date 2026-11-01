import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const anchors = {
  'ain-diab': [['lap 39', '39-му колі'], ['Schell', 'Шелл']],
  anderstorp: [['Five formal protests', "п'ять офіційних протестів"], ['0.086 seconds', '0,086 секунди']],
  bugatti: [['compact Bugatti loop', 'короткому кільці Bugatti'], ['ZF failures', 'Поломки ZF']],
  'clermont-ferrand': [['rough track edges', 'шорстких узбіч'], ['Marko', 'Марко']],
};

test('four historically cross-checked circuits retain 20 distinct bilingual blocked research scenes', () => {
  let count = 0;
  for (const [id, evidence] of Object.entries(anchors)) {
    const circuit = source.circuits.find(c => c.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(circuit.stories.map(s => s.narrative.en)).size, 5);
    assert.equal(new Set(circuit.stories.map(s => s.narrative.uk)).size, 5);
    const joined = {en: circuit.stories.map(s => s.narrative.en).join(' '), uk: circuit.stories.map(s => s.narrative.uk).join(' ')};
    for (const [en, uk] of evidence) {
      assert.ok(joined.en.includes(en), id + '/en/' + en);
      assert.ok(joined.uk.includes(uk), id + '/uk/' + uk);
    }
    for (const s of circuit.stories) {
      count++;
      assert.ok(s.narrative.en.split(/\s+/).length >= 60, id + '/en length');
      assert.ok(s.narrative.uk.split(/\s+/).length >= 50, id + '/uk length');
      assert.ok(s.source_urls.some(u => u.includes('formula1.com/en/results/')), id + '/classification');
      assert.ok(s.historical_sources.some(u => u.includes('motorsportmagazine.com')), id + '/period report');
      assert.ok(s.historical_sources.some(u => u.includes('grandprix.com')), id + '/independent race account');
      assert.equal(s.historical_review_status, 'pending_independent_claim_review', id);
      assert.equal(s.independent_approval, false, id);
      assert.equal(s.publication, 'blocked', id);
    }
  }
  assert.equal(count, 20);
  assert.equal(source.publication, 'blocked');
});
