import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimeMachineComparison } from '../apps/web/src/lib/time-machine-contract.ts';

const counts = (result_entries, races, winning_races) => ({ result_entries, races, winning_races });
const fixture = () => ({ data: {
  focus: { entity_type: 'driver', entity_id: '9007199254740993', name: 'Fixture Driver' },
  from_year: 1950, to_year: 1951,
  added: [{ entity_type: 'constructor', entity_id: '7', name: 'Added Constructor', from: null, to: counts(2, 2, 1) }],
  removed: [{ entity_type: 'constructor', entity_id: '8', name: 'Removed Constructor', from: counts(3, 2, 0), to: null }],
  unchanged: [{ entity_type: 'constructor', entity_id: '9', name: 'Unchanged Constructor', from: counts(4, 3, 1), to: counts(5, 4, 2) }],
  provenance: 'imported-main-race-results',
  limitations: ['seasonal_observations_not_contracts_or_transfers', 'absence_of_record_not_proof_of_absence'],
} });
const parse = value => parseTimeMachineComparison(value, 'driver', '9007199254740993', 1950, 1951);
const invalid = change => {
  const value = fixture(); change(value.data);
  assert.throws(() => parse(value), /Malformed Time Machine comparison/);
};

test('parses added, removed and unchanged observations with exact string IDs and counts', () => {
  const result = parse(fixture());
  assert.equal(result.focus.entity_id, '9007199254740993');
  assert.equal(result.added[0].to?.winning_races, 1);
  assert.equal(result.removed[0].from?.result_entries, 3);
  assert.equal(result.unchanged[0].from?.races, 3);
  assert.equal(result.unchanged[0].to?.races, 4);
});

test('parses reciprocal constructor focus and driver neighbor kind', () => {
  const value = fixture();
  value.data.focus = { entity_type: 'constructor', entity_id: '8', name: 'Fixture Constructor' };
  value.data.added = [{ entity_type: 'driver', entity_id: '9007199254740993', name: 'Fixture Driver', from: null, to: counts(1, 1, 0) }];
  value.data.removed = [];
  value.data.unchanged = [];
  const result = parseTimeMachineComparison(value, 'constructor', '8', 1950, 1951);
  assert.equal(result.focus.entity_type, 'constructor');
  assert.equal(result.added[0].entity_id, '9007199254740993');
});

test('rejects list envelopes, mismatched focus or years, duplicate IDs and unsupported relation kinds', () => {
  assert.throws(() => parse({ data: [] }), /Malformed Time Machine comparison/);
  invalid(data => { data.focus.entity_id = '8'; });
  invalid(data => { data.to_year = 1952; });
  invalid(data => { data.unchanged[0].entity_id = data.added[0].entity_id; });
  invalid(data => { data.added[0].entity_type = 'entrant'; });
});

test('rejects invalid observation groups, non-string IDs and impossible counts', () => {
  invalid(data => { data.added[0].from = counts(1, 1, 0); });
  invalid(data => { data.removed[0].to = counts(1, 1, 0); });
  invalid(data => { data.unchanged[0].from = null; });
  invalid(data => { data.added[0].entity_id = 7; });
  invalid(data => { data.added[0].to = counts(1, 2, 0); });
  invalid(data => { data.added[0].to = counts(1, 1, 2); });
});

test('rejects same-season requests and malformed limitation metadata', () => {
  assert.throws(() => parseTimeMachineComparison(fixture(), 'driver', '9007199254740993', 1950, 1950));
  invalid(data => { data.limitations = ['']; });
});
