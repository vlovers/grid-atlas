import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const file = new URL('../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const byId = new Map(data.circuits.map((c) => [c.circuit_id, c]));
const anchors = {
  'ain-diab': [
    ['damaged nose', 'пошкоджений ніс'],
    ['gap to the winner', 'Готорн виграв чемпіонат'],
    ['0.8-second finishing gap', 'розрив у 0,8'],
    ['regain his lap', 'повернути коло'],
    ["Brooks had briefly retaken", 'Брукс ще повернув позицію'],
  ],
  anderstorp: [
    ["BT46B's only Grand Prix victory", 'Єдина перемога BT46B'],
    ['Patrese kept the Arrows in front', 'Патрезе зберіг перевагу Arrows'],
    ['comeback after a tyre stop', 'повернення після заміни шини'],
    ['without the points', 'без очок'],
    ['already lost the lead on track', 'лідерство він утратив на трасі'],
  ],
  bremgarten: [
    ["González's pole", 'поул Гонсалеса'],
    ['final gap cannot convey', 'Фінішний розрив'],
    ["Herrmann's podium", 'Геррманн довіз Mercedes'],
    ["Mieres's pace", "темп М'єреса"],
    ['backup plan vanished', 'Запасний план зник'],
  ],
  'clermont-ferrand': [
    ['avoiding the stones', 'уникати каміння'],
    ['protect it from the same Matra', 'захищати його від тієї самої Matra'],
    ['puncture came to changing the winner', 'прокол змінив долю'],
    ["Cevert's fourth place", 'четверте місце Севера'],
    ["Lauda's four laps", 'чотири кола Лауди'],
  ],
};

test('twenty EN/UK scene conclusions retain individual race facts and blocked publication', () => {
  assert.equal(data.publication, 'blocked');
  let count = 0;
  for (const [id, pairs] of Object.entries(anchors)) {
    const circuit = byId.get(id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(circuit.stories.map((s) => s.narrative.en)).size, 5);
    assert.equal(new Set(circuit.stories.map((s) => s.narrative.uk)).size, 5);
    for (const [i, story] of circuit.stories.entries()) {
      count++;
      assert.ok(story.narrative.en.includes(pairs[i][0]), id + '/' + i + '/en');
      assert.ok(story.narrative.uk.includes(pairs[i][1]), id + '/' + i + '/uk');
      assert.ok(story.narrative.en.trim().split(/\s+/).length >= 65);
      assert.ok(story.narrative.uk.trim().split(/\s+/).length >= 55);
      assert.doesNotMatch(story.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.equal(story.publication, 'blocked');
      assert.equal(story.independent_approval, false);
      assert.equal(story.historical_review_status, 'pending_independent_claim_review');
      assert.ok(new Set(story.historical_sources.map((u) => new URL(u).hostname)).size >= 2);
      assert.match(story.historical_source_locator, /classification/i);
      assert.match(story.historical_source_locator, /review pending/i);
    }
  }
  assert.equal(count, 20);
});

test('chronology, classification and disputed technology remain separate', () => {
  const get = (id, i) => byId.get(id).stories[i - 1];
  assert.match(get('ain-diab', 2).narrative.en, /lap 39/);
  assert.match(get('anderstorp', 1).narrative.en, /five formal protests/i);
  assert.match(get('anderstorp', 1).narrative.en, /(?:withdrew|withdrawal)/);
  assert.match(get('anderstorp', 5).historical_source_locator, /lap 38 or 39/);
  assert.match(get('bremgarten', 5).narrative.uk, /Запасний план зник/);
  assert.match(get('clermont-ferrand', 4).narrative.en, /injured hand from his practice crash/);
  assert.match(get('clermont-ferrand', 5).narrative.en, /separate stone hazard/);
});
