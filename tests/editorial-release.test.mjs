import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { releasePilots, journeyYears, selectedYear } from '../apps/web/src/components/stories/release-model.ts';
import { parsePublishedArticle } from '../apps/web/src/components/stories/published-article.ts';
import { renderReleaseReview, startReleaseReview } from '../scripts/preview-editorial-release.mjs';
const { articleSections } = createRequire(import.meta.url)('../apps/api/scripts/editorial-body.cjs');
const article = () => ({ id: '9007199254740993', locale: 'en', slug: 'synthetic', title: 'Synthetic article', body_markdown: '## Career\n\nSynthetic claim.', published_at: '2026-10-21T12:00:00Z', references: [], sections: [{ heading: 'Career', claim_ids: ['1'] }], claims: [{ id: '1', statement: 'Synthetic claim.', evidence: [{ url: 'https://example.org/evidence', title: 'Synthetic source', publisher: 'Test', author: null, accessed_on: '2026-10-21', locator: 'row 1' }] }] });

test('curated release contains exactly five canonical pilots and bounded record coordinates', () => {
  assert.equal(new Set(releasePilots.map(p => p.slug)).size, 5);
  for (const p of releasePilots) {
    assert.equal(p.races.length, 4); assert.deepEqual(journeyYears(p, []), []);
    assert.deepEqual(journeyYears(p, [{ year: p.years[0] }]), [p.years[0]]);
    assert.ok(p.prompt.uk && p.prompt.en);
  }
  assert.equal(selectedYear('2000', [1991, 2000]), 2000);
  for (const raw of ['9999', ['2000'], '2000.0', undefined]) assert.equal(selectedYear(raw, [1991, 2000]), 1991);
  assert.equal(selectedYear('2000', []), null);
});
test('published prose must cover each approved statement once and only once', () => {
  const claims = [{ id: '1', statement: 'Synthetic claim.' }, { id: '2', statement: 'Second claim.' }];
  assert.deepEqual(articleSections('## Career\n\nSynthetic claim.\n\n## Seasons\n\nSecond claim.', claims).map(s => s.claims.map(c => c.id)), [['1'], ['2']]);
  for (const body of ['Synthetic claim.', '## Career\n\nSynthetic claim.\n\nInjected prose.', 'Synthetic claim.\n\nSynthetic claim.\n\nSecond claim.', '## Empty\n\n## Career\n\nSynthetic claim.\n\nSecond claim.']) assert.throws(() => articleSections(body, claims));
  assert.throws(() => articleSections('Synthetic claim.', [claims[0], claims[0]]));
});
test('web contract preserves exact IDs and rejects missing/unsafe evidence or wrong locale', () => {
  assert.equal(parsePublishedArticle(article(), 'en').id, '9007199254740993');
  for (const mutate of [x => x.claims[0].evidence = [], x => x.claims[0].evidence[0].url = 'javascript:alert(1)', x => x.claims[0].evidence[0].locator = '', x => x.sections[0].claim_ids = ['unknown'], x => x.sections.push(x.sections[0]), x => x.claims.push(x.claims[0]), x => x.locale = 'uk']) {
    const x = article(); mutate(x); assert.throws(() => parsePublishedArticle(x, 'en'));
  }
});
test('five-driver review shows both locales, citations and explicitly unsigned decisions', () => {
  for (const locale of ['uk', 'en']) {
    const html = renderReleaseReview(locale, '/review/test');
    assert.match(html, /noindex,nofollow,noarchive/);
    assert.match(html, /NOT APPROVED|НЕ СХВАЛЕНО/);
    for (const p of releasePilots) assert.ok(html.includes(`id="${p.slug}"`));
    assert.match(html, /https:\/\/www.formula1.com/);
    assert.match(html, /No human review|Людської перевірки немає/);
  }
  const page = readFileSync(new URL('../apps/web/src/app/[locale]/stories/[slug]/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /docs\/editorial|dossier\.json|review\.json/);
});
test('release preview reuses explicit opt-in and loopback-only opaque routes', async () => {
  assert.throws(() => startReleaseReview(), /acknowledge/);
  const server = startReleaseReview({ port: 0, acknowledged: true });
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const missing = await fetch(`${origin}/en`); assert.equal(missing.status, 404);
    assert.match(missing.headers.get('x-robots-tag'), /noindex/);
    assert.equal(missing.headers.get('cache-control'), 'no-store');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
