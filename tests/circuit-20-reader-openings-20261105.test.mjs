import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stories = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-next20-stories.json', import.meta.url), 'utf8'));
const expected = ['ain-diab', 'aintree', 'avus', 'brands-hatch', 'dijon', 'donington', 'estoril', 'fuji', 'istanbul', 'long-beach', 'marina-bay', 'yas-marina', 'austin', 'baku', 'jeddah', 'miami', 'las-vegas', 'adelaide', 'jarama', 'zolder'];

test('20 EN/UK reader-first circuit stories retain meaningful historical context and closed publication gates', () => {
  assert.equal(stories.length, 20);
  assert.deepEqual(new Set(stories.map(story => story.id)), new Set(expected));
  for (const story of stories) {
    assert.equal(story.human_approval, false, story.id);
    assert.equal(story.publication_allowed, false, story.id);
    assert.ok(story.historical_sources?.length >= 1, story.id + ' research source');
    assert.ok(story.source.startsWith('https://'), story.id + ' classification source');
    assert.equal(story.historical_review_status, 'pending_independent_claim_review', story.id);
    for (const locale of ['en', 'uk']) {
      const paragraphs = story.description[locale].split(/\n\s*\n/).filter(Boolean);
      assert.ok(paragraphs.length >= 2, story.id + ' ' + locale + ' requires a reader introduction');
      assert.ok(paragraphs[0].length > 105, story.id + ' ' + locale + ' reader opening');
      assert.ok(story.description[locale].length > 450, story.id + ' ' + locale + ' must retain substantive narrative');
      assert.ok(story.title[locale].length > 12, story.id + ' ' + locale + ' title');
    }
  }
});
