import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', import.meta.url), 'utf8'));
const independentHosts = new Set(['www.motorsportmagazine.com', 'www.grandprix.com', 'www.autosport.com']);

test('eleven Montreal and Suzuka reader moments have bilingual narrative context and independent source links', () => {
  assert.equal(data.publication, 'blocked_pending_independent_historical_review');
  let count = 0;
  for (const [id, expected] of [['gilles-villeneuve', 5], ['suzuka', 6]]) {
    const circuit = data.circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit);
    assert.equal(circuit.publication, 'unpublished');
    assert.equal(circuit.moments.length, expected);
    for (const moment of circuit.moments) {
      assert.ok(moment.narrative.en.trim().split(' ').length >= 70, id + ' EN ' + moment.year);
      assert.ok(moment.narrative.uk.trim().split(' ').length >= 60, id + ' UK ' + moment.year);
      assert.ok(moment.sources.some((url) => independentHosts.has(new URL(url).hostname)), id + ' independent source ' + moment.year);
      assert.notEqual(moment.review_status, 'approved');
      count++;
    }
  }
  assert.equal(count, 11);
});
