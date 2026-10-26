import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('apps/web/src/components/stories/editorial-previews.ts', 'utf8');
const start = source.indexOf('= [') + 2;
const end = source.lastIndexOf('] as const;') + 1;
assert.ok(start > 1 && end > start, 'editorial preview literal must exist');
const stories = JSON.parse(source.slice(start, end));

test('ten editorial race scenes have distinct, bilingual reader-first summaries', () => {
  assert.equal(stories.length, 10);
  assert.equal(new Set(stories.map(story => story.slug)).size, 10);
  for (const story of stories) {
    assert.match(story.slug, /^[a-z0-9-]+$/);
    for (const locale of ['en', 'uk']) {
      const copy = story[locale];
      assert.ok(copy.title.length >= 12, `${story.slug} ${locale}: missing title`);
      assert.ok(copy.summary.length >= 170, `${story.slug} ${locale}: synopsis lacks narrative context`);
      assert.ok(copy.summary.length <= 650, `${story.slug} ${locale}: too long for a catalogue card`);
      assert.doesNotMatch(copy.summary, /<[^>]+>|(?:https?:\/\/)/, `${story.slug} ${locale}: untrusted markup or URL`);
      assert.match(copy.summary, /(?:\d{4}|\d{1,2}|Фудзі|Діжон|Монреаль|Сахір|Монці|Інтерлагосі|Ferrari|Формулу-1|Dijon|Monza|Montreal|Sakhir|Interlagos)/, `${story.slug} ${locale}: missing historical scene anchor`);
    }
  }
});

test('editorial stories stay separate from published archival pilot journeys', () => {
  const page = readFileSync('apps/web/src/app/[locale]/stories/moments/[slug]/page.tsx', 'utf8');
  assert.match(page, /index: false/);
  assert.match(page, /editorial-draft-articles/);
  assert.match(page, /approvedEditorialPhoto/);
  const published = JSON.parse(readFileSync('apps/web/src/components/media/publication.json', 'utf8'));
  assert.deepEqual(published.assets, []);
});
