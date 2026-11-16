// Regressions from the second independent review of PR #422 (findings N1, N2, N9), which
// reach the policy itself. Each reproduction was verified with 0 failures before the fix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkClaim, claimDigest } from '../packages/editorial-policy/src/index.ts';
import { codes, context, datasetVerifier, entities, run, seal, validItem, verify } from './fixtures/editorial-policy-fixture.mjs';

const ref = (record, field) => ({ dataset: 'f1db', release: 'v2026.17.0', record, field });

test('N1. a race record backs only a statement of its own season', () => {
  const item = validItem();
  // Winner of the 1961 race cited for a 1963 statement; 1963 itself is supplied by the 1963 season record.
  item.claims[1].entity = { type: 'circuit', id: 'fixture-ring' };
  item.claims[1].statement = { en: 'Fixture Driver won the 1963 race.', uk: 'Перегони 1963 року виграв Fixture Driver.' };
  item.claims[1].evidence = [{ dataset_ref: ref('race:1961-fixture', 'winner'), value: 'fixture-driver' }];
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  const found = codes(run(seal(item)));
  assert.ok(found.includes('dataset_season_not_stated'), found.join());
});

test('N2. EN and UK must name the same entities; names only one language contains fail', () => {
  const item = validItem();
  item.claims[1].statement.uk = 'Сенна виграв перегони 1961 року.'; // name first, normal UK word order
  verify(item, item.claims[1], datasetVerifier, 'dataset_comparison');
  assert.ok(codes(run(seal(item))).includes('claim_entities_differ_across_locales'));

  const lower = validItem();
  lower.claims[1].statement.uk = 'Перегони 1961 року виграв сенна.';
  verify(lower, lower.claims[1], datasetVerifier, 'dataset_comparison');
  assert.ok(codes(run(seal(lower))).includes('claim_entities_differ_across_locales'), 'lowercase name is still recognised');

  // A recogniser without Ukrainian coverage fails closed for any claim that names someone.
  const blind = validItem();
  const decision = run(seal(blind), { entities: (text, locale) => (locale === 'uk' ? [] : entities(text)) });
  assert.ok(codes(decision).includes('claim_entities_differ_across_locales'));
  assert.ok(codes(decision).includes('block_entities_differ_across_locales'));
});

test('N2. block prose in UK cannot name someone the EN prose does not', () => {
  const item = validItem();
  item.blocks[0].body.uk = item.blocks[0].body.uk.replace('Fixture Driver виграв', 'Сенна виграв');
  const found = codes(run(seal(item)));
  assert.ok(found.includes('block_entities_differ_across_locales'));
});

test('N9. dataset values without a scope fail closed', () => {
  const item = validItem();
  const ctx = context(item, { dataset: () => 'fixture-driver' });
  const claim = item.claims[1];
  claim.verification.claim_sha256 = claimDigest(claim, item.sources);
  const failures = checkClaim(claim, item, ctx).failures.map(f => f.code);
  assert.ok(failures.includes('dataset_record_unscoped'), failures.join());
});
