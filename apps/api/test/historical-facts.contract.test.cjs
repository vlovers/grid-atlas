const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const file = readFileSync(join(__dirname, '../src/historical-facts.controller.ts'), 'utf8');
test('public facts route never reads unpublished research storage', () => {
  assert.match(file, /return \{ data: \[\], publication: 'unavailable'/);
  assert.doesNotMatch(file, /SELECT|FROM historical_technical_facts|this\.db\.query/);
});
test('public facts route checks entity kind and year bounds', () => {
  assert.match(file, /driver_season/);
  assert.match(file, /constructor_season/);
  assert.match(file, /circuit_layout/);
  assert.match(file, /race_event/);
  assert.match(file, /2100/);
});
