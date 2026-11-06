import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const narrative = readFileSync(new URL('../apps/web/src/components/editorial/circuit-narrative.tsx', import.meta.url), 'utf8');
const stories = readFileSync(new URL('../apps/web/src/components/editorial/circuit-public-moments.ts', import.meta.url), 'utf8');

test('unapproved circuit history renders only the existing public bilingual summary', () => {
  assert.match(narrative, /const previous = getPublicCircuitStory\(circuitId\)/);
  assert.match(narrative, /const biography = approved \? candidate\?\.biography/);
  assert.match(narrative, /previous \? <><h3>\{previous\.title\[locale\]\}<\/h3>/);
  assert.match(narrative, /<p>\{previous\.description\[locale\]\}<\/p>/);
  assert.match(narrative, /<ReviewDetails locale=\{locale\} \/>/);
  assert.match(narrative, /href="#circuit-moments"/);
  assert.match(narrative, /featuredStoryIsBiography && moment\.id/);
  assert.doesNotMatch(stories, /from ['"].*circuit-candidates/);
});

test('research-only editions and unverifiable race years stay behind existing gates', () => {
  assert.match(narrative, /isCircuitEditionApproved\(circuitId\)/);
  assert.match(narrative, /uniqueRaceInYear\(history, moment\.raceYear\)/);
  assert.match(narrative, /parseSingleCircuitYear\(featured\.year\)/);
  assert.match(stories, /A range or multi-year label is not an archive race identifier/);
});
