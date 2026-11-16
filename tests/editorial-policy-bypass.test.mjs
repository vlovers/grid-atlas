// Adversarial review of the editorial policy (PR #421). Each test encodes an attempted bypass
// found during review; all must be rejected. Synthetic fixtures only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePublication, sha256 } from '../packages/editorial-policy/src/index.ts';
import { codes, context, researcher, run, seal, snapshot, validItem, verify, writer } from './fixtures/editorial-policy-fixture.mjs';

test('B1. a block with no numbers cannot skip claims entirely', () => {
  const item = validItem();
  item.blocks.push({ block_id: 'b-uncited', kind: 'history', claim_ids: [], links: [],
    body: { en: 'Fixture Driver later called it the most dangerous track in the world.', uk: 'Пізніше Fixture Driver назвав її найнебезпечнішою трасою світу.' } });
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('uncited_block'));
});

test('B2. a truncated excerpt cannot support a different number ("4" from "4.2")', () => {
  const item = validItem();
  const claim = item.claims[0];
  claim.statement = { en: 'The road course was shortened to 4 kilometres before the first championship race in 1961.', uk: 'Перед першою заліковою гонкою 1961 року дорожню трасу скоротили до 4 кілометрів.' };
  claim.evidence[0].excerpt = 'original road course was shortened to 4';
  verify(item, claim);
  item.blocks[0].body.en = item.blocks[0].body.en.replace('4.2', '4');
  item.blocks[0].body.uk = item.blocks[0].body.uk.replace('4.2', '4');
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('excerpt_not_in_source'));
});

test('B3. Ukrainian numerals must also be evidenced (small numbers are not exempt in the facts)', () => {
  const item = validItem();
  item.blocks[0].body.uk += ' Того дня фінішували 3 автомобілі.';
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('block_number_unclaimed'));

  const claimDrift = validItem();
  claimDrift.claims[1].statement.uk = 'Перегони 1961 року виграв Fixture Driver з 2 кіл переваги.';
  verify(claimDrift, claimDrift.claims[1], { id: 'f1db-verifier', role: 'automated_verifier', run_id: 'run-v1' }, 'dataset_comparison');
  assert.ok(codes(run(seal(claimDrift))).includes('claim_number_unsupported'));
});

test('B4. the writer cannot manufacture the source snapshots it cites', () => {
  const item = validItem();
  item.sources = item.sources.map(source => ({ ...source, retrieved_by: writer }));
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('source_captured_by_writer'));
});

test('B5. two subdomains of one publisher are not two independent publishers', () => {
  const item = validItem();
  item.sources[0] = snapshot('s-a', 'https://en.example.org/fixture-a', 'Example', item.sources[0].text);
  item.sources[1] = snapshot('s-b', 'https://de.example.org/fixture-b', 'Example', item.sources[1].text);
  verify(item, item.claims[0]);
  const decision = run(seal(item));
  assert.equal(decision.outcome, 'UNVERIFIABLE');
  assert.ok(codes(decision).includes('evidence_insufficient'));
});

test('B6. a disclosed dispute still needs an identified verifier', () => {
  const item = validItem();
  item.claims[0].presentation = 'conflict_disclosed';
  verify(item, item.claims[0]);
  item.claims[0].verification = { ...item.claims[0].verification, status: 'disputed', verifier: null, method: 'none' };
  const decision = run(seal(item));
  assert.notEqual(decision.outcome, 'PASS');
  assert.ok(codes(decision).includes('verification_incomplete'));
});

test('B7. the writer cannot be its own localizer', () => {
  const item = validItem();
  item.authorship.localizer = { ...writer, role: 'localization' };
  assert.ok(codes(run(seal(item))).includes('self_localization'));
});

test('B8. non-commercial licences are restricted even if a caller allow-lists them', () => {
  const item = validItem();
  item.media[0].required = true;
  item.media[0].license.identifier = 'CC-BY-NC-4.0';
  item.sources[2] = snapshot('s-license', 'https://commons.example.org/file-page', 'Fixture Commons', 'Licensed under CC-BY-NC-4.0.');
  const decision = run(seal(item), { license_allowlist: ['CC-BY-NC-4.0'] });
  assert.equal(decision.outcome, 'UNVERIFIABLE');
  assert.ok(codes(decision).includes('restricted_use'));
});

test('B9. malformed input yields FAIL instead of throwing', () => {
  const item = validItem();
  item.claims[0].evidence.push({ not_a_source: true });
  const decision = evaluatePublication(item, context(item));
  assert.equal(decision.outcome, 'FAIL');
  assert.ok(codes(decision).includes('malformed_input'));
});

test('B10. verification recorded before the cited source was retrieved is rejected', () => {
  const item = validItem();
  item.sources = item.sources.map(s => ({ ...s, retrieved_at: '2026-11-17T00:00:00Z' }));
  const decision = run(seal(item));
  assert.ok(codes(decision).includes('verified_before_retrieval'));
});

test('B11. placeholder text inside claim statements is rejected', () => {
  const item = validItem();
  item.claims[0].statement.en = 'TODO: confirm. ' + item.claims[0].statement.en;
  verify(item, item.claims[0]);
  assert.ok(codes(run(seal(item))).includes('placeholder'));
});

test('regression guard: the clean fixture still passes after the hardening', () => {
  assert.equal(run(validItem()).outcome, 'PASS');
  assert.equal(researcher.role, 'research');
  assert.equal(sha256('x').length, 64);
});
