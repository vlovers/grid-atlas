import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = path => readFileSync(join(process.cwd(), path), 'utf8');
const directory = 'apps/web/src/components/stories/';
const previews = read(directory + 'editorial-previews.ts');
const paths = read(directory + 'editorial-moment-model.ts');
const scenes = read(directory + 'editorial-moment-scenes.ts');
const articles = read(directory + 'editorial-draft-articles.ts');
const related = read(directory + 'editorial-related.ts');
const hub = read('apps/web/src/app/[locale]/stories/page.tsx');
const detail = read('apps/web/src/app/[locale]/stories/moments/[slug]/page.tsx');
const slugs = ['lauda-hunt-1976','senna-prost-1988-89','villeneuve-arnoux-1979','vettel-monza-2008','button-canada-2011','perez-sakhir-2020','kubica-bmw-2008','schumacher-ferrari-1996-2000','massa-2008','brawn-2009'];

// Parse the literal JSON emitted by the editorial import, without loading TypeScript.
function literal(source, declaration) {
  const prefix = 'export const ' + declaration + ' = ';
  const start = source.indexOf(prefix);
  assert.notEqual(start, -1, declaration + ' declaration missing');
  const suffix = source.slice(start + prefix.length);
  const terminator = suffix.indexOf(' as const;');
  assert.notEqual(terminator, -1, declaration + ' literal terminator missing');
  return JSON.parse(suffix.slice(0, terminator));
}

test('ten bilingual previews have distinct slugs and content', () => {
  const items = literal(previews, 'editorialStoryPreviews');
  assert.equal(items.length, 10);
  assert.deepEqual(items.map(item => item.slug), slugs);
  for (const item of items) for (const locale of ['en', 'uk']) {
    assert.ok(item[locale].title.length > 12);
    assert.ok(item[locale].summary.length > 80);
  }
});

test('all ten stories have four or more bilingual long-form chapters', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  for (const slug of slugs) for (const locale of ['en', 'uk']) {
    const chapters = drafts[slug]?.[locale];
    assert.ok(chapters?.length >= 4, slug + '/' + locale + ' missing chapters');
    for (const chapter of chapters) {
      assert.ok(chapter.heading.length > 5, slug + ' heading missing');
      assert.ok(chapter.paragraphs.some(paragraph => paragraph.length > 100), slug + ' chapter lacks body');
    }
  }
});

test('all ten stories have reading paths, scenes and related links', () => {
  const momentScenes = literal(scenes, 'editorialMomentScenes');
  for (const slug of slugs) {
    assert.ok(paths.includes("'" + slug + "'"));
    assert.ok(related.includes('"' + slug + '"'));
    assert.equal(momentScenes[slug]?.length, 4);
    for (const scene of momentScenes[slug]) for (const locale of ['en', 'uk']) assert.ok(scene[locale].length > 50);
  }
});

test('draft route is linked, noindexed and renders full manuscripts', () => {
  assert.ok(hub.includes('/stories/moments/'));
  assert.ok(detail.includes('index: false'));
  assert.ok(detail.includes('notFound()'));
  assert.ok(detail.includes('draftArticle(slug, locale)'));
  assert.ok(detail.includes('chapters.map('));
  assert.ok(detail.includes('relatedEditorialMoments(slug)'));
  assert.ok(detail.includes('not a final publication'));
});

test('all story subjects and race coordinates are complete and consistently mapped', () => {
  const people = literal(read(directory + 'editorial-people.ts'), 'storyPeople');
  const coordinates = literal(read(directory + 'editorial-race-coordinates.ts'), 'editorialRaceCoordinates');
  const context = literal(read(directory + 'editorial-race-context.ts'), 'editorialRaceContext');
  assert.deepEqual(Object.keys(people), slugs);
  assert.deepEqual(Object.keys(coordinates), slugs);
  assert.deepEqual(Object.keys(context), slugs);
  let raceCount = 0;
  for (const slug of slugs) {
    assert.ok(people[slug].length >= 1);
    assert.ok(coordinates[slug].length >= 1);
    assert.equal(context[slug].length, coordinates[slug].length);
    const unique = new Set();
    for (const [externalId, en, uk] of people[slug]) {
      assert.match(externalId, /^[a-z0-9-]+$/);
      assert.ok(en.length >= 5 && uk.length >= 5);
    }
    for (const [index, [year, round, en, uk]] of coordinates[slug].entries()) {
      assert.ok(Number.isInteger(year) && year >= 1950 && year <= 2026);
      assert.ok(Number.isInteger(round) && round >= 1 && round <= 25);
      assert.ok(!unique.has(year + ':' + round), slug + ' duplicates a race');
      unique.add(year + ':' + round);
      assert.ok(en.length > 5 && uk.length > 5);
      assert.ok(context[slug][index][0].length > 50);
      assert.ok(context[slug][index][1].length > 50);
      raceCount++;
    }
  }
  assert.equal(raceCount, 12);
});

test('archive identity and race links fail closed on ambiguity', () => {
  const personResolver = read(directory + 'editorial-people-resolver.ts');
  const raceResolver = read(directory + 'editorial-race-resolver.ts');
  assert.ok(personResolver.includes('driver.external_id === externalId'));
  assert.ok(personResolver.includes('exact.length !== 1'));
  assert.ok(raceResolver.includes('row.round === round'));
  assert.ok(raceResolver.includes('unique.length === 1'));
  assert.ok(detail.includes('resolveEditorialRaces(slug)'));
  assert.ok(detail.includes('storyRaceContext(slug, index, locale)'));
  assert.ok(detail.includes('/races/'));
});

test('editorial photo registry requires local files and complete attribution', () => {
  const media = read(directory + 'editorial-media.ts');
  const page = read('apps/web/src/app/[locale]/stories/moments/[slug]/page.tsx');
  const ledger = read('docs/editorial/MEDIA-PROVENANCE.md');
  assert.match(media, /editorialPhotos: Partial<Record<string, EditorialPhoto>> = \{/);
  assert.match(media, /photo\.src\.startsWith\('\/media\/editorial\/'\)/);
  assert.match(media, /photo\.licenseUrl\.startsWith\('https:\/\/'\)/);
  assert.match(media, /photo\.sourceUrl\.startsWith\('https:\/\/'\)/);
  assert.match(page, /approvedEditorialPhoto\(slug\)/);
  assert.match(page, /<Image src=\{photo\.src\}/);
  assert.match(page, /photo\.creator/);
  assert.match(page, /photo\.licenseUrl/);
  for (const slug of slugs) assert.ok(ledger.includes(slug), slug + ' missing photo intake ledger entry');
});


test('Commons media intake runs only on explicit manual request; PR discovery remains unapproved', () => {
  const workflow = read('.github/workflows/editorial-photo-intake.yml');
  assert.match(workflow, /name: Discover candidates for all ten stories \(unreviewed\)/);
  assert.match(workflow, /name: Fetch Commons candidates and provenance\n\s+if: github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /name: Upload private review package \(not published\)/);
  assert.match(workflow, /path: \.grid-atlas\/media-review\//);
  assert.doesNotMatch(workflow, /path: apps\/web\/public\/media\/editorial\//);
  const discovery = read('scripts/editorial-photo-discovery.mjs');
  assert.match(discovery, /UNREVIEWED — DO NOT PUBLISH/);
  const intake = read('scripts/editorial-media-intake.mjs');
  assert.ok(intake.includes('.grid-atlas/media-review') || intake.includes('media-review'));
});

test('eight researched story manuscripts retain independently scoped result evidence', () => {
  const reviewed = slugs.filter(slug => slug !== 'massa-2008' && slug !== 'brawn-2009');
  assert.equal(reviewed.length, 8);
  for (const slug of reviewed) {
    const manuscript = read('docs/editorial/research/people-who-changed-f1-20261025/' + slug + '.en-uk.md');
    assert.ok(manuscript.includes('## Verified classification checkpoint — 2026-10-26'), slug + ' lacks provenance checkpoint');
    assert.ok(manuscript.includes('EN · Official-result facts'), slug + ' lacks English results');
    assert.ok(manuscript.includes('UK · Факти з офіційних результатів'), slug + ' lacks Ukrainian results');
    assert.ok(manuscript.includes('Claims still requiring independent review'), slug + ' lacks evidence limitations');
    assert.ok(manuscript.includes('https://www.formula1.com/en/results/'), slug + ' lacks official classification');
  }
  const items = literal(previews, 'editorialStoryPreviews');
  for (const item of items.filter(item => reviewed.includes(item.slug))) {
    assert.ok(item.en.summary.length > 100 && item.uk.summary.length > 100);
    assert.ok(!item.en.summary.includes('result records') && !item.uk.summary.includes('записи результатів'));
  }
});

test('all eight core stories close with readable bilingual narrative, not interface specifications', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  const eight = slugs.filter(slug => slug !== 'massa-2008' && slug !== 'brawn-2009');
  for (const slug of eight) for (const locale of ['en', 'uk']) {
    const last = drafts[slug][locale].at(-1);
    const closing = last.paragraphs.join(' ');
    assert.ok(closing.length > 350, slug + '/' + locale + ' closing too thin');
    assert.doesNotMatch(closing, /the archive should|a reader should|an interactive timeline|візуальна хронологія|архів має|читач має побачити|сторінці конструктора/i, slug + '/' + locale + ' ends with product specification');
    assert.ok(last.heading.length > 12, slug + '/' + locale + ' lacks a narrative closing title');
  }
});

test('all ten pivotal chapters give bilingual race narratives rather than archive instructions', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  const chapterIndex = {
    'lauda-hunt-1976': 2,
    'senna-prost-1988-89': 1,
    'villeneuve-arnoux-1979': 1,
    'vettel-monza-2008': 1,
    'button-canada-2011': 2,
    'perez-sakhir-2020': 1,
    'kubica-bmw-2008': 2,
    'schumacher-ferrari-1996-2000': 1,
    'massa-2008': 2,
    'brawn-2009': 2,
  };
  assert.deepEqual(Object.keys(chapterIndex), slugs);
  for (const slug of slugs) for (const locale of ['en', 'uk']) {
    const chapter = drafts[slug]?.[locale]?.[chapterIndex[slug]];
    assert.ok(chapter, slug + '/' + locale + ' missing chapter');
    const prose = chapter.paragraphs.join(' ');
    assert.ok(prose.length >= 390, slug + '/' + locale + ' narrative too short');
    assert.doesNotMatch(prose, /the archive should|the story should|an archive|архів має|сторінка конструктора|історичний архів|interactive timeline|інтерактивна хронологія/i, slug + '/' + locale + ' contains product-brief prose');
  }
});

test('all ten stories begin with concrete bilingual race scenes, not boilerplate conclusions', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  const generic = /^(it is tempting|it would be|a retrospective|the surprise|this story|a formula 1 championship|було б|легко пояснити|щоб зрозуміти|історія починається)/i;
  for (const slug of slugs) {
    for (const locale of ['en', 'uk']) {
      const first = drafts[slug][locale][0];
      assert.equal(first.paragraphs.length, 2, slug + '/' + locale + ' needs a scene and consequential second beat');
      assert.ok(first.heading.length >= 12);
      assert.ok(first.paragraphs[0].length >= 180 && first.paragraphs[1].length >= 120);
      assert.doesNotMatch(first.paragraphs[0], generic, slug + '/' + locale + ' begins with AI-style framing');
      assert.doesNotMatch(first.paragraphs.join(' '), /the archive should|the story should|an interactive timeline|історичний архів|архів має/i);
    }
  }
});

test('ten turning-point chapters focus on historical events instead of editorial instructions', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  const indexBySlug = {
    'lauda-hunt-1976': 3,
    'senna-prost-1988-89': 3,
    'villeneuve-arnoux-1979': 3,
    'vettel-monza-2008': 3,
    'button-canada-2011': 3,
    'perez-sakhir-2020': 3,
    'kubica-bmw-2008': 3,
    'schumacher-ferrari-1996-2000': 3,
    'massa-2008': 3,
    'brawn-2009': 3,
  };
  assert.deepEqual(Object.keys(indexBySlug), slugs);
  for (const slug of slugs) for (const locale of ['en', 'uk']) {
    const chapter = drafts[slug][locale][indexBySlug[slug]];
    assert.ok(chapter, slug + '/' + locale + ' missing turning point');
    const body = chapter.paragraphs.join(' ');
    assert.ok(body.length > 350, slug + '/' + locale + ' turning point needs narrative');
    assert.doesNotMatch(body, /archive should|readers should|a full Deep Dive|the story should|archive needs|архів має|історія повинна|читач(?:ам|еві) варто|потрібно показати/i);
  }
});

test('all ten story middle acts add readable bilingual events without editor instructions', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  for (const slug of slugs) for (const locale of ['en', 'uk']) {
    const chapter = drafts[slug]?.[locale]?.[2];
    assert.ok(chapter, slug + '/' + locale + ' missing second act');
    const body = chapter.paragraphs.join(' ');
    assert.ok(body.length > 390, slug + '/' + locale + ' second act too thin');
    assert.doesNotMatch(body, /the archive should|the story needs|a reader should|we should resist|readers should|a visual timeline|архів має|не слід удавати|історія повинна|читач має/i, slug + '/' + locale + ' includes editorial meta-copy');
  }
});

test('ten second chapters advance the story in natural EN/UK instead of recapping the introduction', () => {
  const drafts = literal(articles, 'editorialDraftArticles');
  for (const slug of slugs) for (const locale of ['en', 'uk']) {
    const chapter = drafts[slug]?.[locale]?.[1];
    assert.ok(chapter, slug + '/' + locale + ' missing second chapter');
    const body = chapter.paragraphs.join(' ');
    assert.ok(body.length > 350, slug + '/' + locale + ' too little scene development');
    assert.doesNotMatch(body, /the archive|a reader should|the story needs|a responsible account|we should resist|the temptation|історичний архів|читач має|спокуса пояснити|відповідальна розповідь/i, slug + '/' + locale + ' contains generic editorial framing');
  }
});
