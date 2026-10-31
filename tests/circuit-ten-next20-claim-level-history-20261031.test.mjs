import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cards = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-next20-stories.json', import.meta.url), 'utf8'));
const evidence = new Map([
  ['ain-diab', ['Brooks', 'Lewis-Evans', 'Брукс', 'Льюїса-Еванса']],
  ['aintree', ['lap 69', 'Brooks', '69-му', 'Брукса']],
  ['avus', ['two one-hour heats', 'sports-car support race', 'два годинні', 'спортивних автомобілів']],
  ['brands-hatch', ['CV joint', 'lap 23', 'шарнір', '23-му']],
  ['istanbul', ['Liuzzi', 'Turn 8', 'Ліуцці', 'восьмому']],
  ['long-beach', ['lap 77', 'differing recollections', '77-му', 'свідчення']],
  ['marina-bay', ['World Motor Sport Council', 'Alonso', 'Всесвітньої ради', 'Алонсо']],
  ['austin', ['lap 42', 'Turn 12', '42-му', 'дванадцятим']],
  ['baku', ['ten-second stop-go', 'Bottas', 'десятисекундний', 'Боттас']],
  ['jeddah', ['ten-second penalty', 'five-second penalty', 'десятисекундний', 'п\'ять секунд']],
]);
test('ten revised short cards preserve bilingual claim-specific evidence and review gates', () => {
  assert.equal(cards.length, 20);
  assert.equal(new Set(cards.map(x => x.id)).size, 20);
  for (const [id, [enA, enB, ukA, ukB]] of evidence) {
    const card = cards.find(x => x.id === id);
    assert.ok(card, id);
    for (const anchor of [enA, enB]) assert.ok(card.description.en.includes(anchor), id + '/en/' + anchor);
    for (const anchor of [ukA, ukB]) assert.ok(card.description.uk.includes(anchor), id + '/uk/' + anchor);
    for (const lang of ['en', 'uk']) assert.ok(card.description[lang].trim().split(/\s+/).length >= 90, id + '/' + lang);
    assert.ok(card.historical_sources.length >= 2, id + '/historical_sources');
    assert.equal(new Set(card.historical_sources).size, card.historical_sources.length);
    assert.ok(card.historical_sources.every(url => new URL(url).protocol === 'https:'));
    assert.ok(card.historical_source_locator.length >= 130, id + '/source_locator');
    assert.equal(card.historical_review_status, 'pending_independent_claim_review');
    assert.equal(card.human_approval, false);
    assert.equal(card.publication_allowed, false);
  }
});
test('race results are not represented as proof of causation or approval', () => {
  const marina = cards.find(x => x.id === 'marina-bay');
  const jeddah = cards.find(x => x.id === 'jeddah');
  const longBeach = cards.find(x => x.id === 'long-beach');
  assert.match(marina.description.en, /FIA investigation did not find Alonso involved/);
  assert.match(jeddah.description.en, /stewards later found/);
  assert.match(longBeach.description.en, /Andretti disputed/);
  for (const card of [marina, jeddah, longBeach]) assert.notEqual(card.publication_allowed, true);
});
