import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cards = JSON.parse(
  readFileSync(
    new URL('../apps/web/src/components/editorial/circuit-extra-stories.json', import.meta.url),
    'utf8',
  ),
);
const anchors = new Map([
  ['buenos-aires', [/96 laps/, /96 кіл/]],
  ['nurburgring', [/9:17\\.4/, /9:17,4/]],
  ['watkins-glen', [/fuel pressure/, /тиском пального/]],
  ['kyalami', [/six laps remaining/, /шість кіл/]],
  ['indianapolis', [/14 Michelin/, /14 пілотів/]],
  ['imola', [/Ratzenberger/, /Ратценбергер/]],
  ['spielberg', [/Beltoise/, /Бельтуаз/]],
  ['paul-ricard', [/Rodríguez/, /Родрігес/]],
  ['mexico-city', [/push-start/, /штовханням/]],
  ['hockenheimring', [/lap 49 of 50/, /49-му з 50 кіл/]],
]);

test('ten circuit stories have bilingual period chronology, scoped independent evidence and no approval', () => {
  assert.equal(anchors.size, 10);
  assert.equal(new Set(cards.map(({ id }) => id)).size, cards.length);
  for (const [id, [englishAnchor, ukrainianAnchor]] of anchors) {
    const card = cards.find((item) => item.id === id);
    assert.ok(card, id);
    assert.match(card.description.en, englishAnchor, id + '/en chronology');
    assert.match(card.description.uk, ukrainianAnchor, id + '/uk chronology');
    assert.ok(card.description.en.trim().split(/\\s+/).length >= 100, id + '/en depth');
    assert.ok(card.description.uk.trim().split(/\\s+/).length >= 90, id + '/uk depth');
    assert.ok(card.historical_sources.length >= 2, id + '/independent research');
    assert.equal(new Set(card.historical_sources).size, card.historical_sources.length, id);
    assert.match(card.historical_source_locator, /(?:Motor Sport|Grandprix|Guardian)/, id);
    assert.ok(card.historical_source_locator.length >= 160, id + '/specific evidence scope');
    assert.equal(card.historical_review_status, 'pending_independent_claim_review', id);
    assert.equal(card.human_approval, false, id);
    assert.equal(card.publication_allowed, false, id);
    assert.match(card.source, /^https:\\/\\//, id + '/result or circuit source');
    for (const url of card.historical_sources) {
      assert.match(url, /^https:\\/\\//, id + '/historical URL');
      assert.notEqual(url, card.source, id + '/classification cannot prove narrative');
      assert.doesNotMatch(url, /^https:\\/\\/(?:www\\.)?formula1\\.com\\//, id);
      assert.doesNotMatch(url, /^https:\\/\\/github\\.com\\//, id);
    }
  }
});

test('evidence boundaries remain explicit for four sensitive histories', () => {
  const byId = new Map(cards.map((card) => [card.id, card]));
  assert.match(byId.get('buenos-aires').historical_source_locator, /cockpit conditions/);
  assert.match(byId.get('kyalami').historical_source_locator, /not asserted/);
  assert.match(byId.get('indianapolis').historical_source_locator, /rescission of guilty verdicts/);
  assert.match(byId.get('imola').historical_source_locator, /not Schumacher's race classification/);
  assert.match(byId.get('paul-ricard').historical_source_locator, /same publisher/);
});
