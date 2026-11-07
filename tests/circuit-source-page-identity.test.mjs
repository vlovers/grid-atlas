import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalHistoricalCountSourcePage, historicalCornerCountObservations, historicalCornerCountReviewByCircuit } from '../apps/web/src/components/editorial/circuit-historical-counts.ts';
import { canonicalHistoricalMapSourcePage } from '../apps/web/src/components/editorial/circuit-historical-map-audit.ts';

for (const canonical of [canonicalHistoricalMapSourcePage, canonicalHistoricalCountSourcePage]) {
  test(`${canonical.name}: page keys are separate from navigable URLs`, () => {
    const original = 'https://www.lapledger.org/circuits/dallas/?utm_source=review#layout';
    const key = canonical(original);
    assert.equal(key, 'lapledger.org/circuits/dallas');
    assert.throws(() => canonical(key), TypeError, 'a comparison key must not be reparsed as a source URL');
    assert.equal(canonical('https://lapledger.org/circuits/dallas'), key);
  });

  test(`${canonical.name}: unrelated pages, selectors and evidence must not collapse`, () => {
    for (const [left, right] of [
      ['https://example.org/archive?id=1984', 'https://example.org/archive?id=1985'],
      ['https://example.org/archive?page=12', 'https://example.org/archive?page=13'],
      ['https://example.org/archive?source=period', 'https://example.org/archive?source=modern'],
      ['https://example.org/archive?layout=', 'https://example.org/archive'],
      ['https://example.org/archive?layout=1984&layout=1985', 'https://example.org/archive?layout=1985&layout=1984'],
      ['https://gdecarli.it/php2/circuit.php?var1=2&scan=12', 'https://gdecarli.it/php2/circuit.php?var1=2&scan=13'],
      ['https://gdecarli.it/php2/circuit.php?var6=12', 'https://gdecarli.it/php2/circuit.php?var6=13'],
      ['https://example.org/archive', 'https://example.org/archive/'],
      ['https://example.org/archive', 'https://www.example.org/archive'],
      ['https://example.org/Archive', 'https://example.org/archive'],
    ]) assert.notEqual(canonical(left), canonical(right), `${left} must differ from ${right}`);
    assert.equal(canonical('https://example.org/archive?id=1984&utm_source=review&fbclid=abc#page12'),
      canonical('https://example.org/archive?id=1984'));
  });
}

test('same-page conflicts preserve all original observations, locators and evidence roles', () => {
  for (const route of historicalCornerCountReviewByCircuit) {
    const expected = historicalCornerCountObservations.filter(x => x.circuit_id === route.circuit_id);
    assert.deepEqual(route.observations, expected);
    for (const conflict of route.same_page_count_conflicts) {
      assert.equal(new URL(conflict.source_url).protocol, 'https:');
      const evidence = route.same_layout_observations.filter(x => canonicalHistoricalCountSourcePage(x.source_url) === conflict.source_page);
      assert.ok(evidence.length >= 2);
      assert.ok(new Set(evidence.map(x => x.locator)).size >= 2);
      assert.ok(new Set(evidence.map(x => x.source_family)).size >= 2);
      assert.deepEqual([...new Set(evidence.map(x => x.turns))].sort((a, b) => a - b), conflict.reported_counts);
    }
  }
});
