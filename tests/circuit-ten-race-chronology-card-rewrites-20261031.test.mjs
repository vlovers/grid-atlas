import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = '../apps/web/src/components/editorial/';
const extras = JSON.parse(readFileSync(new URL(base + 'circuit-extra-stories.json', import.meta.url), 'utf8'));
const final33 = JSON.parse(readFileSync(new URL(base + 'circuit-final33-stories.json', import.meta.url), 'utf8'));
const anchors = new Map([
  ['hungaroring', /lap 55/],
  ['sepang', /appeal court/],
  ['buddh', /Grosjean/],
  ['yeongam', /Webber/],
  ['detroit', /Watson/],
  ['mugello', /Albon/],
  ['lusail', /Virtual Safety Car/],
  ['valencia', /alternator/],
  ['portimao', /Sainz/],
  ['sirius', /Rosberg/],
]);

test('ten bilingual circuit cards retain race chronology, independent context and fail-closed review', () => {
  const cards = new Map([...extras, ...final33].map((card) => [card.id, card]));
  assert.equal(anchors.size, 10);
  for (const [id, anchor] of anchors) {
    const card = cards.get(id);
    assert.ok(card, 'Missing circuit ' + id);
    assert.match(card.description.en, anchor, id + ': race detail missing');
    assert.ok(card.description.en.trim().split(/\s+/).length >= 85, id + ': English story too short');
    assert.ok(card.description.uk.trim().split(/\s+/).length >= 65, id + ': Ukrainian story too short');
    assert.match(card.description.uk, /[А-ЯІЇЄҐа-яіїєґ]/u, id + ': missing Ukrainian narrative');
    assert.ok(card.source, id + ': original classification or context source missing');
    assert.ok(card.historical_sources.length >= 2, id + ': historical evidence links missing');
    assert.ok(card.historical_sources.every((url) => /^https:\/\//.test(url)), id + ': malformed historical URL');
    assert.ok(card.historical_source_locator?.length >= 60, id + ': locator too vague');
    assert.equal(card.historical_review_status, 'pending_independent_claim_review', id);
    assert.equal(card.human_approval, false, id);
    assert.equal(card.publication_allowed, false, id);
  }
});
