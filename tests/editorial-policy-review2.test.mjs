// Regression tests for the independent review of PR #421 (findings H1, H2, M1–M3 and LOW items).
// Each reproduction reached PASS before the fix. Synthetic fixtures only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePublication, numberTokens, sha256 } from '../packages/editorial-policy/src/index.ts';
import { PINNED, codes, context, datasetVerifier, run, seal, snapshot, validItem, verify, writer } from './fixtures/editorial-policy-fixture.mjs';

const both = (item, en, uk) => { item.blocks[0].body.en += ` ${en}`; item.blocks[0].body.uk += ` ${uk}`; };

test('H1a. an unchecked claim.value cannot back numbers in prose', () => {
  const item = validItem();
  item.claims[0].value = 1958;
  verify(item, item.claims[0]);
  both(item, 'The circuit had opened in 1958.', 'Трасу відкрили в 1958 році.');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('block_number_unclaimed'));
});

test('H1b. non-ASCII digits are rejected', () => {
  const item = validItem();
  both(item, 'It held ٣ races.', 'Тут відбулося ٣ гонки.');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('non_ascii_digits'));
});

test('H1c. counted numbers written as words must be evidenced like digits', () => {
  const item = validItem();
  both(item, 'Fixture Driver won by four laps.', 'Fixture Driver переміг з перевагою в чотири кола.');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('block_number_unclaimed'));
  assert.deepEqual(numberTokens('won by four laps'), ['4']);
  assert.deepEqual(numberTokens('з перевагою в чотири кола'), ['4']);
  assert.deepEqual(numberTokens('one of the greatest drivers'), [], 'idioms are not counts');
});

test('H2a. an unrelated dataset record cannot support a narrative claim', () => {
  const item = validItem();
  item.claims.push({
    claim_id: 'c-marshal', entity: { type: 'circuit', id: 'fixture-ring' }, claim_type: 'historical_event', importance: 'critical',
    statement: { en: 'A marshal was killed at the circuit in 1961.', uk: '1961 року на трасі загинув маршал.' }, presentation: 'asserted',
    evidence: [{ dataset_ref: { dataset: 'f1db', release: PINNED, record: 'race:1961-fixture', field: 'winner' }, value: 'fixture-driver' }],
    verification: null,
  });
  verify(item, item.claims[2], datasetVerifier, 'dataset_comparison');
  item.blocks[0].claim_ids.push('c-marshal');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('dataset_value_not_stated'));

  // Even when the dataset value is named, a narrative claim needs sources, not just the dataset.
  item.claims[2].statement = { en: 'A marshal was killed at the circuit in 1961, the year Fixture Driver won.', uk: '1961 року, коли переміг Fixture Driver, на трасі загинув маршал.' };
  item.claims[2].evidence.push({ dataset_ref: { dataset: 'f1db', release: PINNED, record: 'race:1961-fixture', field: 'season' }, value: 1961 });
  verify(item, item.claims[2]); // recorded fact-checker, so only the sufficiency rule is under test
  const narrative = run(seal(item));
  assert.equal(narrative.outcome, 'UNVERIFIABLE');
  assert.ok(codes(narrative).includes('evidence_insufficient'));
});

test('H2b. a dataset record cannot back a statement naming someone else', () => {
  const item = validItem();
  item.claims[1].statement = { en: 'Ayrton Senna won the 1961 race.', uk: 'Перегони 1961 року виграв Айртон Сенна.' };
  item.blocks[0].body.en = item.blocks[0].body.en.replace('Fixture Driver won', 'Ayrton Senna won');
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('dataset_value_not_stated'));
});

test('M1. swapping a cited snapshot invalidates the claim verification', () => {
  const item = validItem();
  const negated = 'Organisers never shortened the road course before the 1961 race, leaving a lap of 4.2 kilometres.';
  item.sources[1] = { ...item.sources[1], text: negated, content_sha256: sha256(negated) };
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('verification_stale'));
});

test('M2. licence evidence must be the asset\'s own page', () => {
  const item = validItem();
  item.media[0] = { ...item.media[0], required: true, source_url: 'https://getty.example.com/editorial/123' };
  item.sources.push(snapshot('s-cc', 'https://creativecommons.org/licenses/by/4.0/', 'Creative Commons', 'Attribution 4.0 International. CC-BY-4.0.'));
  item.media[0].license.evidence_source_id = 's-cc';
  const decision = run(seal(item));
  assert.equal(decision.outcome, 'UNVERIFIABLE');
  assert.ok(codes(decision).includes('license_evidence_missing'));
});

test('M3. a future-dated verification is rejected', () => {
  const item = validItem();
  item.claims[0].verification.verified_at = '2099-01-01T00:00:00Z';
  const decision = run(seal(item));
  assert.ok(codes(decision).includes('verified_in_future'));
  assert.notEqual(decision.outcome, 'PASS');
});

test('LOW. actor identity is case/space-insensitive and roles are enforced', () => {
  const caseVariant = validItem();
  caseVariant.authorship.fact_checker = { id: ' Writer-Agent ', role: 'fact_check', run_id: 'run-x' };
  assert.ok(codes(run(seal(caseVariant))).includes('self_fact_check'));

  const wrongRole = validItem();
  wrongRole.authorship.fact_checker = { id: 'someone', role: 'writer', run_id: 'run-s' };
  assert.ok(codes(run(seal(wrongRole))).includes('fact_checker_role_invalid'));

  const strayVerifier = validItem();
  verify(strayVerifier, strayVerifier.claims[0], { id: 'other-checker', role: 'fact_check', run_id: 'run-o' });
  assert.ok(codes(run(seal(strayVerifier))).includes('verifier_not_recorded_fact_checker'));

  const localizerVerifies = validItem();
  verify(localizerVerifies, localizerVerifies.claims[0], { ...localizerVerifies.authorship.localizer, role: 'automated_verifier' });
  assert.ok(codes(run(seal(localizerVerifies))).includes('localizer_verified_claim'));
  assert.equal(writer.id, 'writer-agent');
});

test('LOW. item dataset release must equal the pinned release', () => {
  const item = validItem();
  item.dataset_release = 'v1999.0.0';
  assert.ok(codes(run(seal(item))).includes('item_dataset_release_mismatch'));
});

test('LOW. spaced licence spellings are normalised before NC/ND rules', () => {
  const item = validItem();
  item.media[0].required = true;
  item.media[0].license.identifier = 'CC BY NC 4.0';
  item.sources[2] = snapshot('s-license', 'https://commons.example.org/file-page', 'Fixture Commons', 'Licensed under CC BY NC 4.0.');
  const decision = evaluatePublication(seal(item), context(item, { license_allowlist: ['CC BY NC 4.0'] }));
  assert.ok(codes(decision).includes('restricted_use'));
});

test('LOW. Ukrainian placeholder markers are caught; ordinary verbs and Roman numerals are not', () => {
  const marker = validItem();
  marker.blocks[0].body.uk += ' ЗРОБИТИ: додати джерело.';
  assert.ok(codes(run(seal(marker))).includes('placeholder'));

  const ordinary = validItem();
  ordinary.blocks[0].body.uk = ordinary.blocks[0].body.uk.replace('скоротили', 'вирішили зробити коротшою');
  ordinary.blocks[0].body.en = ordinary.blocks[0].body.en.replace('Fixture Driver won that first race.', 'Fixture Driver won that first race, the XXX edition.');
  assert.ok(!codes(run(seal(ordinary))).includes('placeholder'));
});
