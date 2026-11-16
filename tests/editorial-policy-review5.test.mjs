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
  item.claims[1].evidence = item.claims[1].evidence.filter(e => 'dataset_ref' in e); // dataset evidence only
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

// Round-4 review of PR #422 (H1, M1).
test('H1. a block resting on a dataset-only claim must state exactly that claim', () => {
  for (const en of ['Fixture Driver won the 1961 Fixture Grand Prix.', 'Fixture Driver lost the 1961 race to a rival.']) {
    const item = datasetOnly('Fixture Driver won the 1961 race.', 'Перегони 1961 року виграв Fixture Driver.');
    item.blocks[0].body = { en, uk: 'Перегони 1961 року виграв Fixture Driver.' };
    const decision = run(seal(item));
    assert.notEqual(decision.outcome, 'PASS', en);
    assert.ok(codes(decision).includes('block_not_canonical'), en);
  }
});

test('M1. a statement the dataset contradicts fails whatever its sources', () => {
  const item = validItem(); // c-winner has dataset and independent source evidence
  const decision = run(item, { datasetConflicts: claim => (claim.claim_id === 'c-winner' ? ['1961: F1DB winner is someone else'] : []) });
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('dataset_contradiction'));
});

// Round-5 review (#421 H1 remainder): adding a weak source must not switch off canonical-block binding,
// tier A is reserved for canonical claims, and block prose itself is checked for dataset contradictions.
test('H1 remainder. a canonical claim that also cites a source still binds its block', () => {
  const item = datasetOnly('Fixture Driver won the 1961 race.', 'Перегони 1961 року виграв Fixture Driver.');
  item.claims[1].evidence.push({ source_id: 's-a', excerpt: 'Fixture Driver won that first race in 1961', locator: 'para 2' });
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  item.blocks[0].body = { en: 'Fixture Driver lost the 1961 race to a rival.', uk: 'Перегони 1961 року виграв Fixture Driver.' };
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('block_not_canonical'));
});

test('tier A is only for items whose claims are all canonical', () => {
  const prose = run(validItem()); // prose winner claim with two publishers
  assert.equal(prose.outcome, 'PASS');
  assert.equal(prose.tier, 'B');
});

test('block prose that the dataset contradicts fails', () => {
  const item = validItem();
  const decision = run(item, { datasetConflicts: claim => (/lost/.test(claim.statement?.en ?? '') ? ['block contradicts F1DB'] : []) });
  assert.equal(decision.outcome, 'PASS', 'no contradiction in the fixture prose');
  item.blocks[0].body.en = item.blocks[0].body.en.replace('Fixture Driver won that first race.', 'Fixture Driver lost that first race.');
  const contradicted = run(seal(item), { datasetConflicts: claim => (/lost/.test(claim.statement?.en ?? '') ? ['block contradicts F1DB'] : []) });
  assert.ok(codes(contradicted).includes('block_dataset_contradiction'));
});
