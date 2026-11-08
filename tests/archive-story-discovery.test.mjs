import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = path => readFileSync(join(process.cwd(), path), 'utf8');
const root = 'apps/web/src/';
const journeys = read(root + 'components/editorial/archive-story-journeys.tsx');
const entity = read(root + 'components/stories/entity-story-links.tsx');
const driver = read(root + 'components/driver/driver-showcase.tsx');
const constructor = read(root + 'app/[locale]/constructors/[id]/page.tsx');
const catalogue = read(root + 'components/catalogue.tsx');
const storyRoute = read(root + 'app/[locale]/stories/moments/[slug]/page.tsx');
const sitemap = read(root + 'lib/sitemap.ts');
const people = read(root + 'components/stories/editorial-people.ts');

test('archive story cards link to the existing editorial moment route, never driver journey routes', () => {
  assert.match(storyRoute, /export default async function EditorialMoment/);
  for (const source of [journeys, entity]) {
    assert.match(source, /\/stories\/moments\/\$\{story\.slug\}/);
    assert.equal(source.includes('/stories/${story.slug}'), false);
    assert.match(source, /isAiReviewedStory\(/);
    assert.match(source, /story\[locale\]\.title/);
    assert.match(source, /story\[locale\]\.summary/);
  }
});

test('driver and constructor associations use canonical external identities, not display names', () => {
  assert.match(entity, /storyPeopleFor\(story\.slug\)/);
  assert.match(entity, /person\[0\] === externalId/);
  assert.match(entity, /constructorStorySlugs\[externalId\]/);
  assert.match(people, /"ayrton-senna"/);
  assert.match(people, /"michael-schumacher"/);
  assert.match(entity, /ferrari:/);
  assert.match(entity, /mclaren:/);
  assert.match(entity, /\bbrawn: \['brawn-2009'\]/);
  assert.doesNotMatch(entity, /'brawn-gp':/);
  assert.doesNotMatch(entity, /\.name\s*===\s*externalId/);
});

test('story panels are wired to both profile types and first catalogue page only', () => {
  assert.match(driver, /<EntityStoryLinks kind="driver" externalId=\{driver\.external_id\}/);
  assert.match(constructor, /<EntityStoryLinks kind="constructor" externalId=\{team\.external_id\}/);
  assert.match(catalogue, /page === 1 && !q && kind !== 'circuits'/);
  assert.match(catalogue, /<ArchiveStoryJourneys kind=\{kind\}/);
});

test('bilingual layouts are responsive and do not alter circuit publication', () => {
  const archiveCss = read(root + 'components/editorial/archive-story-journeys.module.css');
  const entityCss = read(root + 'components/stories/entity-story-links.module.css');
  assert.match(archiveCss, /max-width: 620px/);
  assert.match(entityCss, /minmax\(min\(100%, 260px\)/);
  assert.match(journeys, /locale === 'uk'/);
  assert.match(entity, /locale === 'uk'/);
  assert.match(sitemap, /'\/time-machine'/);
  assert.doesNotMatch(entity, /circuit-release|independent_review_pending/);
});

test('archive and entity story copy identifies AI review without claiming human approval', () => {
  assert.match(journeys, /through AI-reviewed stories\./);
  assert.match(journeys, /в історіях, перевірених ШІ\./);
  assert.match(entity, /AI-reviewed stories associated with this profile\./);
  assert.match(entity, /Історії, перевірені ШІ та пов’язані з цією сторінкою\./);
  for (const source of [journeys, entity]) {
    assert.doesNotMatch(source, /Reviewed editorial stories associated with this profile\./);
    assert.doesNotMatch(source, /через перевірені історії\./);
  }
});

test('unreviewed editorial manuscripts are not directly served or indexed', () => {
  assert.match(storyRoute, /if \(\(locale !== 'uk' && locale !== 'en'\) \|\| !story \|\| !isAiReviewedStory\(slug\)\) notFound\(\)/);
  assert.match(storyRoute, /if \(!story \|\| !isAiReviewedStory\(slug\)\) notFound\(\)/);
  assert.match(storyRoute, /robots: \{ index: isAiReviewedStory\(slug\), follow: true \}/);
  assert.match(storyRoute, /const chapters = draftArticle\(slug, locale\)/);
  assert.ok(storyRoute.indexOf('if (!story || !isAiReviewedStory(slug)) notFound()') < storyRoute.indexOf('const chapters = draftArticle(slug, locale)'));
});
