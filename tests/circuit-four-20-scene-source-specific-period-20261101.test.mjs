import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const ids = ['ain-diab', 'bremgarten', 'bugatti', 'clermont-ferrand'];
const byId = new Map(data.circuits.map((c) => [c.circuit_id, c]));

test('20 period scenes have distinct bilingual historical evidence pointers and blocked publication', () => {
  let count = 0;
  for (const id of ids) {
    const c = byId.get(id);
    assert.ok(c, id);
    assert.deepEqual(c.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(c.stories.map((s) => s.historical_source_locator)).size, 5);
    for (const s of c.stories) {
      count++;
      assert.ok(s.narrative.en.trim().split(/\s+/).length >= 65, id + ':en:' + s.story_index);
      assert.ok(s.narrative.uk.trim().split(/\s+/).length >= 55, id + ':uk:' + s.story_index);
      assert.doesNotMatch(s.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.match(s.historical_source_locator, /Motor Sport/);
      assert.match(s.historical_source_locator, /Grandprix.com/);
      assert.match(s.historical_source_locator, /classification/);
      assert.match(s.historical_source_locator, /review pending/);
      assert.ok(new Set(s.historical_sources.map((u) => new URL(u).hostname)).size >= 2);
      assert.equal(s.independent_approval, false);
      assert.equal(s.publication, 'blocked');
    }
  }
  assert.equal(count, 20);
  assert.equal(data.publication, 'blocked');
});

test('Charade hand injury and Bugatti repeated lap narrative stay corrected', () => {
  const scene = (id, n, lang) => byId.get(id).stories[n - 1].narrative[lang];
  assert.match(scene('clermont-ferrand', 4, 'en'), /injured hand from his practice crash/);
  assert.match(scene('clermont-ferrand', 4, 'uk'), /травмованою рукою після аварії на тренуванні/);
  assert.doesNotMatch(scene('bugatti', 4, 'en'), /Clark took the lead on lap five, Hill regained it on lap eleven/);
  assert.match(scene('bugatti', 1, 'en'), /4\.422-kilometre/);
  assert.match(byId.get('bugatti').stories[0].historical_source_locator, /4\.430 km/);
  assert.match(scene('bremgarten', 5, 'uk'), /Запасний план зник/);
});
