// Regression tests for the second independent review of PR #421 (head 8d010bd3).
// Each reproduction reached PASS (or was accepted by assertPublishable) before the fix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPublishable, evaluatePublication, numberTokens, PublicationRefused } from '../packages/editorial-policy/src/index.ts';
import { codes, context, datasetVerifier, run, seal, validItem, verify } from './fixtures/editorial-policy-fixture.mjs';

test('HIGH 1a. a structured claim citing only the season record cannot name a different winner', () => {
  const item = validItem();
  item.claims[1].statement = { en: 'Ayrton Senna won the 1961 race.', uk: 'Перегони 1961 року виграв Айртон Сенна.' };
  item.claims[1].evidence = item.claims[1].evidence.filter(e => e.dataset_ref.field === 'season');
  item.blocks[0].body.en = item.blocks[0].body.en.replace('Fixture Driver won', 'Ayrton Senna won');
  item.blocks[0].body.uk = item.blocks[0].body.uk.replace('Fixture Driver виграв', 'Айртон Сенна виграв');
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('claim_entity_unsupported'));
});

test('HIGH 1b. a Ukrainian-only name change in the claim is caught', () => {
  const item = validItem();
  item.claims[1].statement.uk = 'Перегони 1961 року виграв Айртон Сенна.';
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('claim_entity_unsupported'));
});

test('HIGH 1c. names in published prose must be named by a cited claim', () => {
  const item = validItem();
  item.blocks[0].body.en = item.blocks[0].body.en.replace('Fixture Driver won', 'Ayrton Senna won');
  item.blocks[0].body.uk = item.blocks[0].body.uk.replace('Fixture Driver виграв', 'Айртон Сенна виграв');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('block_entity_unclaimed'));
});

test('HIGH 2. remaining number-word forms are counted', () => {
  const expect = {
    'won by four full laps': ['4'], 'a dozen races': ['12'], 'a hundred laps': ['100'], 'twenty-one laps': ['21'],
    'finished fourth': ['4'], 'won twice': ['2'], 'пʼять кіл': ['5'], 'сорок кіл': ['40'], 'сто кіл': ['100'],
    'фінішував четвертим': ['4'], 'one of the greatest drivers': [], 'the first race': [], 'одна з найкращих трас': [],
  };
  for (const [text, tokens] of Object.entries(expect)) assert.deepEqual(numberTokens(text), tokens, text);
  const item = validItem();
  item.blocks[0].body.en += ' He finished fourth the next year.';
  item.blocks[0].body.uk += ' Наступного року він фінішував четвертим.';
  assert.ok(codes(run(seal(item))).includes('block_number_unclaimed'));
});

test('MEDIUM 3. a decision dated after the publisher clock is refused', () => {
  const item = validItem();
  item.claims[0].verification.verified_at = '2099-01-01T00:00:00Z';
  const forged = evaluatePublication(seal(item), context(item, { evaluated_at: '2100-01-01T00:00:00Z' }));
  assert.equal(forged.outcome, 'PASS', 'precondition: the forged context alone passes');
  assert.throws(() => assertPublishable(item, context(item), forged), PublicationRefused);
});

test('MEDIUM 4. source-based verification must come from the recorded fact-checker, whatever role is declared', () => {
  for (const role of ['human', 'automated_verifier']) {
    const item = validItem();
    verify(item, item.claims[0], { id: `other-${role}`, role, run_id: `run-${role}` }, 'source_excerpt_match');
    assert.ok(codes(run(seal(item))).includes('verifier_not_recorded_fact_checker'), role);
  }
  // The automated dataset verifier remains valid for dataset comparison.
  assert.equal(run(validItem()).outcome, 'PASS');
});

test('LOW. zero-width characters cannot make two actor ids distinct', () => {
  const item = validItem();
  item.authorship.fact_checker = { id: 'writer​-agent', role: 'fact_check', run_id: 'run-zw' };
  assert.ok(codes(run(seal(item))).includes('self_fact_check'));
});

// From the independent review of PR #422: dataset records must belong to the claim's subject.
test('HIGH (#422 review). a record from another race or circuit cannot back the claim', () => {
  const ref = (record, field) => ({ dataset: 'f1db', release: 'v2026.17.0', record, field });
  const mixed = validItem();
  mixed.claims[1].evidence = [{ dataset_ref: ref('race:1962-elsewhere', 'winner'), value: 'fixture-driver' }, { dataset_ref: ref('race:1961-fixture', 'season'), value: 1961 }];
  verify(mixed, mixed.claims[1], datasetVerifier, 'dataset_comparison');
  const decision = run(seal(mixed));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('dataset_record_out_of_scope'));

  const otherCircuit = validItem();
  otherCircuit.claims[1].entity = { type: 'circuit', id: 'fixture-ring' };
  otherCircuit.claims[1].evidence = [{ dataset_ref: ref('race:1962-elsewhere', 'winner'), value: 'fixture-driver' }, { dataset_ref: ref('race:1962-elsewhere', 'season'), value: 1962 }];
  otherCircuit.claims[1].statement = { en: 'Fixture Driver won here in 1962.', uk: 'Fixture Driver переміг тут 1962 року.' };
  verify(otherCircuit, otherCircuit.claims[1], datasetVerifier, 'dataset_comparison');
  assert.ok(codes(run(seal(otherCircuit))).includes('dataset_record_out_of_scope'));
});

test('HIGH (#422 review). one claim cannot combine records of two races', () => {
  const ref = (record, field) => ({ dataset: 'f1db', release: 'v2026.17.0', record, field });
  const item = validItem();
  item.claims[1].entity = { type: 'circuit', id: 'fixture-ring' };
  // Two races at the same circuit, both in scope: the 1961 winner cannot be paired with the 1963 season.
  item.claims[1].statement = { en: 'Fixture Driver won here in 1961 and 1963.', uk: 'Fixture Driver переміг тут 1961 та 1963 років.' };
  item.claims[1].evidence = [{ dataset_ref: ref('race:1961-fixture', 'winner'), value: 'fixture-driver' }, { dataset_ref: ref('race:1963-fixture', 'season'), value: 1963 }];
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  const found = codes(run(seal(item)));
  assert.ok(found.includes('dataset_records_inconsistent'));
  assert.ok(!found.includes('dataset_record_out_of_scope'));
});
