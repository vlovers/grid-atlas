import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = '../apps/web/src/components/editorial/';
const cards = [
  ...JSON.parse(readFileSync(new URL(base + 'circuit-final33-stories.json', import.meta.url), 'utf8')),
  ...JSON.parse(readFileSync(new URL(base + 'circuit-next20-stories.json', import.meta.url), 'utf8')),
];
const expected = new Map([
  ['sebring', ['Brabham', 'fuel', 'McLaren', 'Бребем', 'пальне']],
  ['mosport', ['Ganley', 'Fittipaldi', 'pace car', 'Генлі', 'Фіттіпальді']],
  ['anderstorp', ['Andretti', 'penalty', 'Depailler', 'Андретті', 'штраф']],
  ['phoenix', ['Alesi', 'Senna', 'lap 34', 'Алезі', 'Сенні']],
  ['porto', ['Hawthorn', 'stewards', 'Moss', 'Готорн', 'Мосс']],
  ['dijon', ['Jabouille', 'Arnoux', '0.240', 'Жабуй', 'Арну']],
  ['fuji', ['Lauda', 'Andretti', 'Hunt', 'Лауда', 'Андретті']],
  ['yas-marina', ['Petrov', 'Rosberg', 'Webber', 'Петрова', 'Росбергу']],
]);

test('eight historical short cards keep source-led bilingual race chronology unpublished', () => {
  assert.equal(expected.size, 8);
  for (const [id, [en1, en2, en3, uk1, uk2]] of expected) {
    const card = cards.find((entry) => entry.id === id);
    assert.ok(card, id);
    assert.ok(card.description.en.split(/\s+/).length >= 110, id + '/English depth');
    assert.ok(card.description.uk.split(/\s+/).length >= 90, id + '/Ukrainian depth');
    for (const anchor of [en1, en2, en3]) {
      assert.ok(card.description.en.includes(anchor), id + '/EN anchor ' + anchor);
    }
    for (const anchor of [uk1, uk2]) {
      assert.ok(card.description.uk.includes(anchor), id + '/UK anchor ' + anchor);
    }
    assert.ok(card.historical_sources.length >= 2, id + '/independent reports');
    assert.equal(new Set(card.historical_sources).size, card.historical_sources.length, id + '/unique reports');
    assert.ok(card.historical_sources.every((url) => new URL(url).hostname !== 'github.com'), id + '/not F1DB as context');
    assert.ok(card.historical_source_locator.length >= 130, id + '/claim locator');
    assert.equal(card.historical_review_status, 'pending_independent_claim_review', id);
    assert.equal(card.human_approval, false, id);
    assert.equal(card.publication_allowed, false, id);
  }
});

test('the race winner is not silently conflated with the champion', () => {
  const sebring = cards.find((entry) => entry.id === 'sebring');
  const fuji = cards.find((entry) => entry.id === 'fuji');
  const yasMarina = cards.find((entry) => entry.id === 'yas-marina');
  assert.match(sebring.description.en, /McLaren.*victory/);
  assert.match(sebring.description.en, /Brabham.*title/);
  assert.match(fuji.description.en, /Andretti won the Grand Prix; Hunt won the title/);
  assert.match(yasMarina.description.en, /Vettel won the race and took his first championship/);
});
