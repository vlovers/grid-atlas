import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const paths = [
  "../apps/web/src/components/editorial/circuit-extra-stories.json",
  "../apps/web/src/components/editorial/circuit-final33-stories.json",
  "../apps/web/src/components/editorial/circuit-next20-stories.json"
];
const cards = paths.flatMap(path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')));
const newlySourced = [
  "adelaide",
  "aida",
  "ain-diab",
  "aintree",
  "austin",
  "avus",
  "bahrain",
  "baku",
  "brands-hatch",
  "buenos-aires",
  "catalunya",
  "dijon",
  "donington",
  "estoril",
  "fuji",
  "hockenheimring",
  "hungaroring",
  "imola",
  "interlagos",
  "istanbul",
  "jarama",
  "jeddah",
  "las-vegas",
  "long-beach",
  "magny-cours",
  "marina-bay",
  "melbourne",
  "mexico-city",
  "miami",
  "montreal",
  "paul-ricard",
  "reims",
  "rouen",
  "sepang",
  "shanghai",
  "spielberg",
  "yas-marina",
  "zandvoort",
  "zolder"
];
test('all 73 short circuit stories have distinct narrative provenance and remain unpublished', () => {
  assert.equal(cards.length, 73);
  assert.equal(new Set(cards.map(x => x.id)).size, 73);
  assert.equal(newlySourced.length, 39);
  for (const card of cards) {
    assert.ok(card.description.en.length >= 250, card.id + '/en');
    assert.ok(card.description.uk.length >= 250, card.id + '/uk');
    assert.ok(card.historical_sources?.length >= 1, card.id + '/narrative');
    assert.ok(card.source.startsWith('https://'), card.id + '/classification');
    assert.equal(card.human_approval, false, card.id);
    assert.equal(card.publication_allowed, false, card.id);
  }
  for (const id of newlySourced) {
    const card = cards.find(x => x.id === id);
    assert.equal(card.historical_review_status, 'pending_independent_claim_review', id);
    assert.ok(card.historical_source_locator.length >= 40, id);
    for (const source of card.historical_sources) {
      const host = new URL(source).hostname;
      assert.notEqual(host, 'github.com', id);
      assert.notEqual(host, 'www.formula1.com', id);
      assert.notEqual(source, card.source, id);
    }
    assert.equal(card.human_approval, false, id);
    assert.equal(card.publication_allowed, false, id);
  }
});
