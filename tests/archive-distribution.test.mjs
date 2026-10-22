import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveDistribution, archivePointPosition } from '../apps/web/src/lib/archive-distribution.ts';

test('circuit archive groups repeated races in the same year and sorts chronologically', () => {
  const result = archiveDistribution([{ year: 1988 }, { year: 1950 }, { year: 1988 }, { year: 1960 }], 'year');
  assert.deepEqual(result.keys, [1950, 1960, 1988]);
  assert.deepEqual(result.counts, [1, 1, 2]);
  assert.equal(result.maxCount, 2);
  assert.equal(archivePointPosition(1950, result.first, result.last), 0);
  assert.equal(archivePointPosition(1988, result.first, result.last), 100);
});

test('season archive distributes by round rather than collapsing into one season year', () => {
  const result = archiveDistribution([{ year: 2020, position: 17 }, { year: 2020, position: 1 }, { year: 2020, position: 8 }], 'round');
  assert.deepEqual(result.keys, [1, 8, 17]);
  assert.deepEqual(result.counts, [1, 1, 1]);
  assert.equal(result.first, 1);
  assert.equal(result.last, 17);
});

test('single-year archives center their graphic and empty archives have safe bounds', () => {
  assert.equal(archivePointPosition(1950, 1950, 1950), 50);
  assert.deepEqual(archiveDistribution([], 'year'), { keys: [], counts: [], first: 0, last: 0, maxCount: 1 });
});

test('invalid or absent round numbers never masquerade as years', () => {
  assert.deepEqual(archiveDistribution([{ year: 2020 }, { year: 2020, position: 2 }, { year: 2020, position: Number.NaN }], 'round').keys, [2]);
  assert.equal(archivePointPosition(500, 1, 5), 100);
});
