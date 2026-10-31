import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const dir = '../apps/web/src/components/editorial/';
const rows = [
  ...JSON.parse(readFileSync(new URL(dir + 'circuit-next20-stories.json', import.meta.url), 'utf8')),
  ...JSON.parse(readFileSync(new URL(dir + 'circuit-final33-stories.json', import.meta.url), 'utf8')),
];
const anchors = new Map([
  ['donington','Prost'],['estoril','higher gears'],['adelaide','Piquet'],
  ['jarama','Watson'],['zolder','penultimate lap'],['dallas','Can-Am'],
  ['zeltweg','driveshaft'],['pescara','oil tank'],['riverside','petrol'],
  ['caesars-palace','constructors'],
]);
test('ten period-backed EN/UK short cards retain historical turning points and blocked publication', () => {
  assert.equal(anchors.size, 10);
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const [id, anchor] of anchors) {
    const row = byId.get(id);
    assert.ok(row, id);
    assert.ok(row.description.en.includes(anchor), id + '/historical anchor');
    assert.ok(row.description.en.trim().split(/\\s+/).length >= 95, id + '/EN depth');
    assert.ok(row.description.uk.trim().split(/\\s+/).length >= 75, id + '/UK depth');
    assert.ok(row.historical_source_locator.length >= 80, id + '/claim locator');
    assert.ok(row.historical_sources.length >= 1, id + '/period source');
    assert.ok(row.historical_sources.every(url => url.startsWith('https://')), id + '/URL');
    assert.equal(row.historical_review_status, 'pending_independent_claim_review', id);
    assert.equal(row.human_approval, false, id);
    assert.equal(row.publication_allowed, false, id);
  }
});
