import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const file = new URL('../apps/web/src/components/editorial/circuit-final33-stories.json', import.meta.url);
const stories = JSON.parse(readFileSync(file, 'utf8'));
const revisedIds = [
  "buddh",
  "dallas",
  "lusail",
  "yeongam",
  "bugatti",
  "sebring",
  "detroit",
  "zeltweg",
  "mugello",
  "phoenix",
  "pescara",
  "montjuic",
  "monsanto",
  "valencia",
  "portimao",
  "nivelles",
  "riverside",
  "bremgarten",
  "east-london",
  "caesars-palace"
];

test('twenty circuit cards carry substantial paired EN/UK prose and separate historical provenance', () => {
  assert.equal(revisedIds.length, 20);
  assert.equal(new Set(revisedIds).size, 20);
  assert.equal(stories.length, 33);
  assert.equal(new Set(stories.map(({ id }) => id)).size, 33);
  const byId = new Map(stories.map((story) => [story.id, story]));
  for (const id of revisedIds) {
    const story = byId.get(id);
    assert.ok(story, id);
    assert.match(story.year, /^(?:19|20)\d{2}$/, id);
    assert.match(story.source, /^https:\/\//, id);
    assert.equal(story.historical_review_status, 'pending_independent_claim_review', id);
    assert.ok(Array.isArray(story.historical_sources), id);
    assert.ok(story.historical_sources.length >= 1, id);
    for (const source of story.historical_sources) {
      const url = new URL(source);
      assert.equal(url.protocol, 'https:', id);
      assert.notEqual(source, story.source, id + ': narrative must not reuse classification-only source');
      assert.ok(!/^(?:www\.)?formula1\.com$/.test(url.hostname), id + ': needs independent narrative source');
      assert.notEqual(url.hostname, 'github.com', id);
    }
    assert.notEqual(story.historical_review_status, 'approved', id);
    assert.notEqual(story.publication_allowed, true, id);
    assert.notEqual(story.human_approval, true, id);
    assert.ok(story.description.en.length >= 300, id + '/en');
    assert.ok(story.description.uk.length >= 280, id + '/uk');
    assert.match(story.description.uk, /[А-ЯІЇЄҐа-яіїєґ]/u, id + '/uk');
    assert.ok(!/\b(?:coming soon|lorem ipsum|tbd)\b/i.test(story.description.en), id);
  }
});

test('all thirty-three expansion short cards preserve bilingual text and result provenance', () => {
  for (const story of stories) {
    assert.ok(story.title.en.length > 10, story.id);
    assert.ok(story.title.uk.length > 10, story.id);
    assert.ok(story.description.en.length > 100, story.id);
    assert.ok(story.description.uk.length > 100, story.id);
    assert.ok(/^https:\/\//.test(story.source), story.id);
    assert.notEqual(story.publication_allowed, true, story.id);
    assert.notEqual(story.human_approval, true, story.id);
  }
});
