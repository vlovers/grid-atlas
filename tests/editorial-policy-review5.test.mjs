// Round-3 review of PR #422: dataset-only verification of free prose kept admitting extra years,
// shared-surname confusion and wrong teams. Since v1.6.0 the dataset alone verifies only canonical
// statements rendered by the trusted publisher renderer; everything else needs independent sources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { codes, datasetVerifier, run, seal, validItem, verify } from './fixtures/editorial-policy-fixture.mjs';

const datasetOnly = (en, uk) => {
  const item = validItem();
  item.blocks = [{ block_id: 'b-stat', kind: 'statistic', body: { en, uk }, claim_ids: ['c-winner'], links: [] }];
  item.claims[1].statement = { en, uk };
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  return seal(item);
};

test('the canonical rendering of the evidence is verified by the dataset alone (tier A)', () => {
  const decision = run(datasetOnly('Fixture Driver won the 1961 race.', 'Перегони 1961 року виграв Fixture Driver.'));
  assert.equal(decision.outcome, 'PASS', codes(decision).join());
  assert.equal(decision.tier, 'A');
});

test('free prose agreeing with the dataset is not verified by it: extra facts need sources', () => {
  for (const [en, uk] of [
    ['Fixture Driver won the 1961 race with Ferrari.', 'Перегони 1961 року виграв Fixture Driver на Ferrari.'],
    ['Fixture Driver won the 1961 race from pole.', 'Перегони 1961 року виграв Fixture Driver з поулу.'],
    ['In 1961 Fixture Driver won the race.', 'У 1961 році перегони виграв Fixture Driver.'],
  ]) {
    const decision = run(datasetOnly(en, uk));
    assert.notEqual(decision.outcome, 'PASS', en);
    assert.ok(codes(decision).includes('evidence_insufficient'), en);
  }
});

test('without a trusted renderer nothing is verified by the dataset alone', () => {
  const decision = run(datasetOnly('Fixture Driver won the 1961 race.', 'Перегони 1961 року виграв Fixture Driver.'), { renderStructured: undefined });
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('evidence_insufficient'));
});

test('a canonical English statement with free Ukrainian prose is not canonical', () => {
  const decision = run(datasetOnly('Fixture Driver won the 1961 race.', 'Fixture Driver блискуче виграв перегони 1961 року.'));
  assert.notEqual(decision.outcome, 'PASS');
});
