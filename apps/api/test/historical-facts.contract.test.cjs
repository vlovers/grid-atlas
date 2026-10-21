const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { HistoricalFactsController } = require('../dist/historical-facts.controller');

function controller() {
  let reads = 0;
  const db = { query: async () => { reads++; throw Error('Research data must remain private'); } };
  return { subject: new HistoricalFactsController(db), reads: () => reads };
}

test('valid requests return unavailable and never touch research storage', async () => {
  const { subject, reads } = controller();
  for (const kind of ['driver_season', 'constructor_season', 'circuit_layout', 'race_event']) {
    const result = await subject.publicFacts(kind, '1', '2020');
    assert.deepEqual(result.data, []);
    assert.equal(result.publication, 'unavailable');
  }
  assert.equal(reads(), 0);
});

test('unknown kind fails closed', async () => {
  const { subject, reads } = controller();
  await assert.rejects(() => subject.publicFacts('secret', '1', '2020'), /Fact category not found/);
  assert.equal(reads(), 0);
});

test('invalid IDs and seasons fail closed', async () => {
  const { subject, reads } = controller();
  for (const id of ['0', '-1', '1 OR 1=1', '2147483648', '01']) {
    await assert.rejects(() => subject.publicFacts('driver_season', id, '2020'), /Invalid entity ID/);
  }
  for (const year of ['1949', '2101', '2020 OR 1=1', '02020']) {
    await assert.rejects(() => subject.publicFacts('driver_season', '1', year), /Invalid season/);
  }
  assert.equal(reads(), 0);
});
