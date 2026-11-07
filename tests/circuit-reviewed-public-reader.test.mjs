import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { circuitArticleSections } from '../apps/web/src/components/editorial/circuit-reviewed-article-model.ts';
import { parsePublishedArticle } from '../apps/web/src/components/stories/published-article.ts';

const root = new URL('../', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
const evidence = { url: 'https://example.org/circuit', title: 'Synthetic archive', publisher: 'Fixture', author: null,
  accessed_on: '2026-10-29', locator: 'paragraph 2' };
const valid = () => ({ id: '4', locale: 'en', slug: 'test-circuit', title: 'Synthetic circuit',
  body_markdown: '## Weekend\n\nSynthetic claim A.\n\nSynthetic claim B.',
  published_at: '2026-10-29T04:00:00Z', references: [{ url: evidence.url, title: evidence.title, publisher: evidence.publisher }],
  claims: [{ id: '1', statement: 'Synthetic claim A.', evidence: [evidence] },
    { id: '2', statement: 'Synthetic claim B.', evidence: [evidence] }],
  sections: [{ heading: 'Weekend', claim_ids: ['1', '2'] }] });

test('published claim projection retains deterministic ordering and individual evidence', () => {
  const parsed = parsePublishedArticle(valid(), 'en');
  const sections = circuitArticleSections(parsed);
  assert.deepEqual(sections.map(s => s.claims.map(c => c.id)), [['1', '2']]);
  assert.equal(sections[0].claims[1].evidence[0].locator, 'paragraph 2');
});

test('wrong locale, unsafe source links, unlinked claims and duplicates fail closed', () => {
  assert.throws(() => parsePublishedArticle(valid(), 'uk'), /Malformed/);
  const unsafe = valid(); unsafe.claims[0].evidence[0] = { ...evidence, url: 'javascript:alert(1)' };
  assert.throws(() => parsePublishedArticle(unsafe, 'en'), /Malformed/);
  const missing = valid(); missing.sections[0].claim_ids = ['1'];
  assert.throws(() => parsePublishedArticle(missing, 'en'), /Malformed/);
  const duplicated = valid(); duplicated.sections[0].claim_ids = ['1', '1'];
  assert.throws(() => parsePublishedArticle(duplicated, 'en'), /Malformed/);
});

test('reader stays disabled without explicit web and API release switches', () => {
  const page = source('apps/web/src/components/editorial/circuit-production-page.tsx');
  const api = source('apps/web/src/lib/api.ts');
  const component = source('apps/web/src/components/editorial/circuit-reviewed-article.tsx');
  const controller = source('apps/api/src/circuit-editorial.controller.ts');
  assert.match(page, /CIRCUIT_EDITORIAL_UI_ENABLED === '1'/);
  assert.match(controller, /CIRCUIT_EDITORIAL_READ_ENABLED !== '1'/);
  assert.match(controller, /Cache-Control', 'private, no-store, max-age=0'/);
  assert.match(api, /getOptionalPublishedCircuitArticle/);
  assert.match(api, /parsePublishedArticle\(payload.data, locale\)/);
  assert.match(component, /circuitArticleSections\(article\)/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|editorialDraftArticles|circuit-candidates|<img/);
  assert.doesNotMatch(page, /editorialDraftArticles|CIRCUIT_EDITORIAL_UI_ENABLED !== '0'/);
});


test('batch keeps existing public summaries while expanded research still requires independent approval', () => {
  const page = source('apps/web/src/components/editorial/circuit-production-page.tsx');
  const biography = source('apps/web/src/components/editorial/circuit-narrative.tsx');
  assert.match(page, /<CircuitBiography circuitId=\{circuit\.external_id\}/);
  assert.match(page, /<CircuitMoments circuitId=\{circuit\.external_id\}/);
  assert.doesNotMatch(page, /circuit-candidates|circuit-history-stories|circuit-release|circuit-public-moments/);
  assert.match(biography, /const biography = approved \? candidate\?\.biography/);
  assert.match(biography, /allowExpandedEdition && isCircuitEditionApproved\(circuitId\)/);
  assert.equal((page.match(/allowExpandedEdition=\{false\}/g) ?? []).length, 2, 'both legacy summary renderers must deny static edition approval in the batch');
  assert.match(page, /temporarily unavailable/);
  assert.match(page, /pinned F1DB release/);
});

test('circuit page keeps a source-backed archive journey without resurrecting unreviewed content', () => {
  const page = source('apps/web/src/components/editorial/circuit-production-page.tsx');
  const journey = source('apps/web/src/components/editorial/circuit-reading-journey.tsx');
  assert.match(page, /circuitReadingModel\(history, layouts, technicalEvents/);
  assert.match(page, /<CircuitReadingJourney model=\{reading\}/);
  assert.match(journey, /id="circuit-race-journey"/);
  assert.match(journey, /href=\{`\/races\/\$\{race\.race_id\}`\}/);
  assert.doesNotMatch(journey, /circuit-candidates|circuit-next20-stories|circuit-visual-intake/);
});
