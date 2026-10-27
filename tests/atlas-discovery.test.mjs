import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonDecades, featuredIdentities, careerSignature } from '../apps/web/src/components/atlas/discovery-model.ts';
import { atlasCopy } from '../apps/web/src/components/atlas/copy.ts';

test('season browser includes only actual imported years, deduplicates and never fills missing years', () => {
  const input = [{ year: 2026 }, { year: 1951 }, { year: 1950 }, { year: 1951 }, { year: 1973 }, { year: 1949 }, { year: 2026.5 }];
  assert.deepEqual(seasonDecades(input), [{ decade: 1950, years: [1950, 1951] }, { decade: 1970, years: [1973] }, { decade: 2020, years: [2026] }]);
  assert.deepEqual(seasonDecades([]), []);
  assert.equal(input[0].year, 2026);
});
test('discovery resolves canonical identities without assuming database IDs, bounds fallback and removes duplicates', () => {
  const senna = { id: '9007199254740993', external_id: 'ayrton-senna' };
  const fallback = Array.from({ length: 8 }, (_, i) => ({ id: String(i), external_id: `synthetic-${i}` }));
  assert.deepEqual(featuredIdentities([undefined, senna, senna], fallback), [senna, fallback[0], fallback[1]]);
  assert.deepEqual(featuredIdentities([undefined], []), []);
});
test('career drawing preserves zeroes and chronological gaps; points never stand for titles or standings', () => {
  const seasons = [{ year: 1954, starts: 10, wins: 2 }, { year: 1950, starts: 5, wins: 0 }, { year: 1951, starts: 0, wins: 0 }];
  const drawing = careerSignature(seasons);
  assert.deepEqual(drawing.map(s => s.year), [1950, 1951, 1954]);
  assert.equal(drawing[1].x - drawing[0].x, (drawing[2].x - drawing[1].x) / 3);
  assert.equal(drawing[1].entriesHeight, 0);
  assert.equal(drawing[0].winsHeight, 0);
  assert.equal(drawing[2].entriesHeight, 150);
  assert.deepEqual(careerSignature([]), []);
  assert.equal(seasons[0].year, 1954);
});
test('Atlas copy is complete in UK and EN and explicitly bounds historical interpretations', () => {
  assert.deepEqual(Object.keys(atlasCopy.en).sort(), Object.keys(atlasCopy.uk).sort());
  for (const copy of Object.values(atlasCopy)) assert.ok(Object.values(copy).every(v => v.trim()));
  assert.match(atlasCopy.en.constructorNote, /not establish contracts/);
  assert.match(atlasCopy.en.comparisonNote, /compare the driver’s teams/);
  assert.doesNotMatch(atlasCopy.en.comparisonNote, /champion|title|official starts/i);
  assert.match(atlasCopy.en.driversNote, /not a ranking/);
});
