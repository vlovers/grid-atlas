import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cards = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-next20-stories.json', import.meta.url), 'utf8'));
const anchors = [
  [
    "brands-hatch",
    "spare Williams",
    "запасному Williams"
  ],
  [
    "fuji",
    "Andretti won",
    "виграв Маріо Андретті"
  ],
  [
    "istanbul",
    "Safety Car",
    "автомобіля безпеки"
  ],
  [
    "long-beach",
    "Scheckter",
    "Шектера"
  ],
  [
    "yas-marina",
    "Petrov",
    "Петрова"
  ],
  [
    "austin",
    "lap 42",
    "42-му колі"
  ],
  [
    "baku",
    "17th",
    "17-те"
  ],
  [
    "jeddah",
    "two red flags",
    "двічі"
  ],
  [
    "miami",
    "lap 9",
    "9-му колі"
  ],
  [
    "las-vegas",
    "different layout",
    "іншою конфігурацією"
  ]
];

test('ten bilingual circuit cards explain sourced race turning points without editorial approval', () => {
  assert.equal(cards.length, 20);
  assert.equal(new Set(cards.map(card => card.id)).size, 20);
  assert.equal(anchors.length, 10);
  for (const [id, en, uk] of anchors) {
    const card = cards.find(entry => entry.id === id);
    assert.ok(card, id);
    assert.ok(card.description.en.includes(en), id + '/en');
    assert.ok(card.description.uk.includes(uk), id + '/uk');
    assert.ok(card.description.en.length >= 400, id + '/en narrative');
    assert.ok(card.description.uk.length >= 400, id + '/uk narrative');
    assert.ok(card.historical_sources.length >= 1, id + ' independent historical source');
    assert.ok(card.historical_sources.every(url => url.startsWith('https://')), id);
    assert.ok(card.historical_sources.every(url => !url.includes('github.com/f1db')), id);
    assert.ok(card.source.includes('/' + card.year + '/'), id + ' pinned result year');
    assert.equal(card.historical_review_status, 'pending_independent_claim_review', id);
    assert.equal(card.human_approval, false, id);
    assert.equal(card.publication_allowed, false, id);
  }
});
