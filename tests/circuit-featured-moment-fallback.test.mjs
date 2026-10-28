import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  circuitStorySourceKind,
  circuitStorySourcePresentation,
  getPublicCircuitStory,
  parseSingleCircuitYear,
  publicCircuitStories,
  uniqueRaceInYear,
} from '../apps/web/src/components/editorial/circuit-public-moments.ts';

const component = readFileSync(new URL('../apps/web/src/components/editorial/circuit-narrative.tsx', import.meta.url), 'utf8');
const legacy = readFileSync(new URL('../apps/web/src/components/editorial/circuit-history-stories.tsx', import.meta.url), 'utf8');
const release = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-release.json', import.meta.url), 'utf8'));
const legacyIds = ['monaco', 'monza', 'suzuka', 'silverstone', 'spa-francorchamps'];

test('all 78 circuits retain a distinct short story, locale and traceable source', () => {
  assert.equal(publicCircuitStories.length, 73, '73 featured stories plus 5 existing legacy circuits');
  const ids = new Set(legacyIds);
  for (const id of legacyIds) assert.ok(legacy.includes(`  ${id.includes('-') ? `'${id}'` : id}: {`), id);
  for (const story of publicCircuitStories) {
    assert.match(story.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(story.id), `duplicate circuit: ${story.id}`);
    ids.add(story.id);
    assert.ok(story.title.en.length > 8 && story.title.uk.length > 8, story.id);
    assert.ok(story.description.en.length > 40 && story.description.uk.length > 40, story.id);
    assert.notEqual(story.title.en, story.title.uk, story.id);
    assert.notEqual(story.description.en, story.description.uk, story.id);
    assert.ok(/^\d{4}(?:[–-]\d{4}| \/ \d{4})?$/.test(story.year), `${story.id}: ${story.year}`);
    const source = new URL(story.source);
    assert.equal(source.protocol, 'https:', story.id);
    assert.ok(
      source.hostname === 'www.formula1.com' ||
      (source.hostname === 'github.com' && source.pathname.startsWith('/f1db/f1db/blob/v2026.17.0/')),
      `${story.id}: unexpected source ${story.source}`,
    );
    if (source.hostname === 'github.com') {
      assert.ok(source.pathname.includes(`/seasons/${story.year}/`), `${story.id}: source year mismatch`);
    }
    assert.equal(getPublicCircuitStory(story.id), story);
  }
  assert.equal(ids.size, 78);
  assert.equal(getPublicCircuitStory('not-a-circuit'), undefined);
});

test('multi-year featured stories display their actual label without inventing a race', () => {
  const multiYear = publicCircuitStories.filter(story => parseSingleCircuitYear(story.year) === null);
  assert.deepEqual(multiYear.map(story => story.id).sort(), [
    'imola', 'interlagos', 'magny-cours', 'mexico-city',
    'montreal', 'paul-ricard', 'spielberg', 'zandvoort',
  ]);
  assert.equal(parseSingleCircuitYear('1950'), 1950);
  assert.equal(parseSingleCircuitYear('1973–1975'), null);
  assert.equal(parseSingleCircuitYear('1978 / 1999'), null);
  assert.equal(parseSingleCircuitYear('not a year'), null);
  assert.doesNotMatch(component, /Number\(featured\.year\)/);
  assert.match(component, /yearLabel: featured\.year/);
});

test('archive race links require one unambiguous event in the given year', () => {
  const races = [
    { race_id: 'one', season_year: 1950 },
    { race_id: 'two', season_year: 1951 },
    { race_id: 'three', season_year: 1951 },
  ];
  assert.equal(uniqueRaceInYear(races, 1950), races[0]);
  assert.equal(uniqueRaceInYear(races, 1951), null);
  assert.equal(uniqueRaceInYear(races, 1952), null);
  assert.equal(uniqueRaceInYear(races, null), null);
  assert.equal(uniqueRaceInYear(races, Number.NaN), null);
  assert.match(component, /uniqueRaceInYear\(history, moment\.raceYear\)/);
});

test('public short-story fallback neither duplicates the biography nor bypasses approval', () => {
  assert.deepEqual(release.editions, [], 'no independent longform editions approved');
  assert.match(component, /getPublicCircuitStory\(circuitId\)/);
  assert.match(component, /isCircuitEditionApproved\(circuitId\)/);
  assert.match(component, /existing\?\.moments\.map/);
  assert.match(component, /href="#circuit-moments"/);
  assert.doesNotMatch(component, /previous\.description\[locale\]/);
  assert.match(component, /noopener noreferrer/);
});

test('all 73 public stories expose honest source types in both languages', () => {
  const byKind = { 'f1db-results': 0, 'formula1-page': 0, other: 0 };
  for (const story of publicCircuitStories) {
    const kind = circuitStorySourceKind(story.source);
    byKind[kind] += 1;
    assert.notEqual(kind, 'other', `Unclassified story source: ${story.id}`);
    const en = circuitStorySourcePresentation(story.source, 'en');
    const uk = circuitStorySourcePresentation(story.source, 'uk');
    assert.ok(en.badge && en.description && en.linkLabel, story.id);
    assert.ok(uk.badge && uk.description && uk.linkLabel, story.id);
    assert.notEqual(en.description, uk.description, story.id);
  }
  assert.deepEqual(byKind, { 'f1db-results': 53, 'formula1-page': 20, other: 0 });
  assert.equal(circuitStorySourceKind('https://example.org/not-reviewed'), 'other');
  assert.equal(circuitStorySourceKind('https://github.com/f1db/f1db/blob/main/src/data/seasons/1950/races/01-britain/race-results.yml'), 'other');
  assert.match(circuitStorySourcePresentation('https://example.org/not-reviewed', 'en').description, /review/);
});

test('circuit moment cards show evidence format and explain limits without claiming editorial approval', () => {
  assert.match(component, /circuitStorySourcePresentation\(moment\.source, locale\)/);
  assert.match(component, /sourcePresentation\.badge/);
  assert.match(component, /sourcePresentation\.description/);
  assert.match(component, /sourcePresentation\.linkLabel/);
  assert.match(component, /noopener noreferrer/);
  assert.deepEqual(release.editions, [], 'source-format UX must not approve candidate dossiers');
});
