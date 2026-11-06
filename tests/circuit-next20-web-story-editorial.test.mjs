import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stories = JSON.parse(
  readFileSync(new URL('../apps/web/src/components/editorial/circuit-next20-stories.json', import.meta.url), 'utf8'),
);

const expected = [
  'ain-diab', 'aintree', 'avus', 'brands-hatch', 'dijon', 'donington',
  'estoril', 'fuji', 'istanbul', 'long-beach', 'marina-bay', 'yas-marina',
  'austin', 'baku', 'jeddah', 'miami', 'las-vegas', 'adelaide', 'jarama', 'zolder',
];

test('twenty circuit summaries retain distinct events and substantial EN/UK copy', () => {
  assert.deepEqual(stories.map(({ id }) => id), expected);
  assert.equal(new Set(stories.map(({ id }) => id)).size, 20);

  for (const story of stories) {
    assert.match(story.year, /^(?:19|20)\d{2}$/);
    assert.match(story.source, /^https:\/\/github\.com\/f1db\/f1db\/blob\/v2026\.17\.0\/src\/data\/seasons\//);
    assert.ok(story.source.includes('/' + story.year + '/'), story.id + ' pinned classification year');
    for (const locale of ['en', 'uk']) {
      assert.ok(story.title[locale].trim().length > 12, story.id + '/' + locale + ' title');
      assert.ok(story.description[locale].trim().length >= 250, story.id + '/' + locale + ' story');
      assert.ok(!/\b(?:lorem ipsum|coming soon|tbd)\b/i.test(story.description[locale]));
    }
  }
});

test('sensitive events and distinct historical layouts remain distinguishable', () => {
  const byId = new Map(stories.map((story) => [story.id, story]));
  for (const [id, en, uk] of [
    ['ain-diab', /Hawthorn.*champion/, /Готорн.*чемпіоном/],
    ['avus', /two heats/, /двома заїздами/],
    ['fuji', /Andretti.*won/, /виграв Маріо Андретті/],
    ['marina-bay', /investigation/, /розслідування/],
    ['las-vegas', /different layout/, /іншою конфігурацією/],
    ['zolder', /Saturday qualifying/, /суботній кваліфікації/],
  ]) {
    assert.match(byId.get(id).description.en, en, id + '/en');
    assert.match(byId.get(id).description.uk, uk, id + '/uk');
  }
});
