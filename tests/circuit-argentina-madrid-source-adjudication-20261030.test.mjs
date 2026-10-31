import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, base), 'utf8'));
const argentina = read('EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json').circuits.find(
  (c) => c.circuit_id === 'buenos-aires',
);
const madrid = read('EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json').circuits.find(
  (c) => c.circuit_id === 'madring',
);
const triage = read('F1DB_33_EXPANSION_SOURCE_TRIAGE_20261028.json');
const chapter = read('SEVEN_REMAINING_CIRCUIT_CHAPTERS_20261029.json').chapters.find(
  (c) => c.circuit_id === 'madring',
);
const officialMadrid =
  'https://www.formula1.com/en/results/2026/races/1294/spain/race-result';

test('Buenos Aires 1995 explicitly preserves the unresolved 71/72-lap archival conflict', () => {
  assert.equal(argentina.stories.length, 5);
  assert.match(argentina.stories[0].narrative.en, /71 or 72 laps/);
  assert.match(argentina.stories[0].narrative.uk, /71 чи 72 кола/);
  for (const scene of argentina.stories) {
    assert.equal(scene.year, 1995);
    assert.match(scene.historical_source_locator, /71 laps.*72 laps/);
    assert.match(scene.historical_source_locator, /not established/);
    assert.ok(scene.historical_sources.some((url) => url.includes('motorsportmagazine.com')));
    assert.ok(scene.historical_sources.some((url) => url.includes('grandprix.com')));
    assert.ok(scene.source_urls.every((url) => url.includes('/1995/races/622/argentina/')));
    assert.equal(scene.independent_approval, false);
    assert.equal(scene.publication, 'blocked');
    for (const locale of ['en', 'uk']) assert.ok(scene.narrative[locale].length > 200);
  }
});

test('Madring 2026 separates race results, VSC reporting and independent venue design evidence', () => {
  assert.equal(madrid.stories.length, 5);
  assert.ok(madrid.stories.slice(0, 4).every(s => s.historical_sources.some((url) => url.includes('grandprix.com'))));
  assert.ok(madrid.stories[4].historical_sources.some((url) => url.includes('espn.com')));
  assert.ok(madrid.stories[4].historical_sources.some((url) => url.includes('madring.com')));
  assert.match(madrid.stories[4].narrative.en, /550 metres/);
  assert.match(madrid.stories[4].narrative.uk, /550 метрів/);
  assert.match(madrid.stories[4].narrative.en, /24%/);
  assert.match(madrid.stories[1].narrative.en, /Virtual Safety Car/);
  assert.match(madrid.stories[1].narrative.uk, /(?:віртуальний автомобіль безпеки|віртуального автомобіля безпеки)/);
  for (const scene of madrid.stories) {
    assert.equal(scene.year, 2026);
    assert.ok(scene.source_urls.includes(officialMadrid));
    assert.ok(!scene.source_urls.some((url) => url.includes('/1294/madrid/')));
    assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
    assert.equal(scene.independent_approval, false);
    assert.equal(scene.publication, 'blocked');
    for (const locale of ['en', 'uk']) assert.ok(scene.narrative[locale].length > 200);
  }
  assert.ok(chapter.source_urls.includes(officialMadrid));
  assert.ok(!chapter.source_urls.some((url) => url.includes('/1294/madrid/')));
  assert.equal(chapter.human_approval, false);
  assert.equal(chapter.publication_allowed, false);
  assert.ok(triage.circuits.find((c) => c.circuit_id === 'madring').source_urls.includes(officialMadrid));
});
