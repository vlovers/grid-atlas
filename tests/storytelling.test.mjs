import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sharedSeason, openingRecord, seasonStories } from '../apps/web/src/components/stories/story-model.ts';
import { storyCopy } from '../apps/web/src/components/stories/copy.ts';

test('paired perspectives require an actual common recorded season; gaps and distinct eras never create a rivalry', () => {
  assert.equal(sharedSeason([{ year: 1984 }, { year: 1986 }, { year: 1993 }], [{ year: 1985 }, { year: 1993 }]), 1993);
  assert.equal(sharedSeason([{ year: 1984 }, { year: 1986 }], [{ year: 1985 }]), null);
  assert.equal(sharedSeason([], [{ year: 1950 }]), null);
});
test('opening scene uses an exact API milestone or remains absent; no invented race or victory', () => {
  const first = { race: { id: '9007199254740993', year: 1950 }, results: [{ shared_car: true }] };
  const win = { race: { id: '12', year: 1951 }, results: [] };
  assert.equal(openingRecord({ milestones: { first_win: win, first_appearance: first } }), win);
  assert.equal(openingRecord({ milestones: { first_win: null, first_appearance: first } }), first);
  assert.equal(openingRecord(null), null);
});
test('season stories are bounded, deterministic and include genuine seasons without wins, never infer titles', () => {
  const seasons = [{ year: 1950, starts: 4, wins: 0 }, { year: 1951, starts: 4, wins: 0 }, { year: 1953, starts: 8, wins: 0 }, { year: 1952, starts: 5, wins: 1 }];
  assert.deepEqual(seasonStories(seasons).map(row => row.year), [1952, 1953, 1950]);
  assert.equal(seasons[0].year, 1950);
  assert.deepEqual(seasonStories([]), []);
});
test('media copy is complete in both languages and marks original art and separately gated rivalry narratives', () => {
  assert.deepEqual(Object.keys(storyCopy.en).sort(), Object.keys(storyCopy.uk).sort());
  for (const copy of Object.values(storyCopy)) assert.ok(Object.values(copy).every(s => typeof s === 'string' && s.trim()));
  assert.match(storyCopy.en.circuitArt, /not a map or historical layout/);
  assert.match(storyCopy.en.narrativeNote, /separate editorial approval/);
  assert.match(storyCopy.en.seasonNote, /not championship standings/);
});
test('art is decorative original code; historical publication manifests and remote media are not imported', () => {
  const art = readFileSync('apps/web/src/components/stories/motorsport-art.tsx', 'utf8');
  assert.match(art, /aria-hidden="true"/);
  assert.doesNotMatch(art, /<image|<img|https?:\/\/|candidates\.json|publication\.json|docs\/editorial|ayrton|mclaren|ferrari/i);
});
