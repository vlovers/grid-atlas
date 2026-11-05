import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const folder = 'apps/web/src/components/editorial/';
const research = ['extra', 'next20', 'final33'].flatMap(name => JSON.parse(readFileSync(`${folder}circuit-${name}-stories.json`, 'utf8')));
const publicStories = ['extra', 'next20', 'final33'].flatMap(name => JSON.parse(readFileSync(`${folder}archive-summaries/circuit-${name}-stories.json`, 'utf8')));

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: every actual circuit keeps unreviewed candidate prose outside public routes`, async ({ page, request }) => {
    test.setTimeout(180_000);
    const circuits = (await (await request.get('http://127.0.0.1:3350/api/circuits?limit=100')).json()).data;
    expect(circuits).toHaveLength(78);
    for (const circuit of circuits) {
      const response = await request.get(`/` + locale + `/circuits/${circuit.id}`);
      expect(response.status(), circuit.external_id).toBe(200);
      const html = await response.text();
      expect(html, circuit.external_id).not.toContain('data-candidate-position');
      expect(html, circuit.external_id).not.toContain('bend-review-');
      expect(html, circuit.external_id).not.toContain('data-testid="circuit-article-reader"');
      const draft = research.find(story => story.id === circuit.external_id);
      const existing = publicStories.find(story => story.id === circuit.external_id);
      if (draft && existing && draft.description[locale] !== existing.description[locale]) {
        // Assert exact prose after HTML entity decoding through the real browser.
        await page.goto(`/${locale}/circuits/${circuit.id}`);
        await expect(page.getByTestId('circuit-moments')).toContainText(existing.description[locale]);
        await expect(page.locator('body')).not.toContainText(draft.description[locale]);
      }
      const article = await request.get(`http://127.0.0.1:3350/api/circuits/${circuit.id}/article?locale=${locale}`);
      expect(article.status()).toBe(404);
      expect(article.headers()['cache-control']).toContain('no-store');
    }
  });
}
