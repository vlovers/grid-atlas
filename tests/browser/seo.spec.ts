import { test, expect, type Page } from '@playwright/test';
import en from '../../apps/web/messages/en.json';
import uk from '../../apps/web/messages/uk.json';

const origin = 'http://127.0.0.1:3340';
const bot = { 'User-Agent': 'Googlebot' };

// Parse the server response as an inert document: no hydration, scripts or
// browser-side API calls can supply the assertions below.
async function inspect(page: Page, html: string) {
  return page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return {
      title: doc.querySelector('title')?.textContent,
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      canonicals: [...doc.querySelectorAll('link[rel="canonical"]')].map(node => node.getAttribute('href')),
      alternates: [...doc.querySelectorAll('link[rel="alternate"]')].map(node => [node.getAttribute('hreflang'), node.getAttribute('href')]),
      robots: [...doc.querySelectorAll('meta[name="robots"]')].map(node => node.getAttribute('content')).join(' '),
      // Next streams completed sections outside the initial <main> shell.
      // Require the actual archive heading, never the loading fallback.
      h1: doc.querySelector('section.page:not([role="status"]) h1, section.hero h1')?.textContent,
      hrefs: [...doc.querySelectorAll('a[href]')].map(node => node.getAttribute('href')),
      crumbs: [...doc.querySelectorAll('nav ol li')].map(node => node.textContent),
      jsonLd: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent!)),
    };
  }, html);
}

for (const [locale, messages] of [['en', en], ['uk', uk]] as const) {
  test(`${locale}: public routes expose distinct metadata, canonical URLs and links in server HTML`, async ({ request, page }) => {
    const routes = ['', '/drivers', '/constructors', '/circuits', '/seasons', '/sources', '/lineage',
      '/drivers/1', '/constructors/1', '/seasons/1950', '/seasons/1951', '/races/1', '/circuits/1', '/entrants/1'];
    const titles = new Set();
    const descriptions = new Set();
    for (const route of routes) {
      const path = `/${locale}${route}`;
      const response = await request.get(path, { headers: bot });
      expect(response.status(), path).toBe(200);
      const doc = await inspect(page, await response.text());
      expect(doc.h1, path).toBeTruthy();
      expect(doc.title, path).toBeTruthy();
      expect(doc.description, path).toBeTruthy();
      expect(doc.canonicals, path).toEqual([`${origin}${path}`]);
      expect(doc.alternates).toContainEqual(['en', `${origin}/en${route}`]);
      expect(doc.alternates).toContainEqual(['uk', `${origin}/uk${route}`]);
      expect(doc.robots, path).not.toContain('noindex');
      expect(titles.has(doc.title), path).toBe(false);
      titles.add(doc.title);
      expect(descriptions.has(doc.description), path).toBe(false);
      descriptions.add(doc.description);
      if (/\/\d+$/.test(route)) {
        const graph = doc.jsonLd[0]['@graph'];
        expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual(['WebPage', 'BreadcrumbList']);
        expect(graph[0].url).toBe(`${origin}${path}`);
        expect(graph[0].description).toBe(doc.description);
        const items = graph[1].itemListElement;
        expect(items.map((item: { name: string }) => item.name)).toEqual(doc.crumbs);
        expect(items.map((item: { position: number }) => item.position)).toEqual(items.map((_: unknown, i: number) => i + 1));
        expect(items.at(-1).item).toBe(`${origin}${path}`);
      }
      if (route === '/races/1') {
        for (const target of ['/drivers/1', '/constructors/1', '/circuits/1', '/seasons/1950']) expect(doc.hrefs).toContain(`/${locale}${target}`);
      }
    }
    const driver = await inspect(page, await (await request.get(`/${locale}/drivers/1`, { headers: bot })).text());
    expect(driver.description).toBe(`driver-a — ${messages.UI.driverLead}`);
  });

  test(`${locale}: search, pagination, duplicates and missing/draft routes have explicit indexing boundaries`, async ({ request, page }) => {
    for (const [query, canonical, noindex] of [
      ['?page=2', '?page=2', false], ['?page=1&utm_source=test', '', false],
      ['?q=driver-a', '', true], ['?q=Synthetic&page=2', '?page=2', true],
      ['?page=1001', '?page=1001', true], ['?page=01', '', false],
    ] as const) {
      const doc = await inspect(page, await (await request.get(`/${locale}/drivers${query}`, { headers: bot })).text());
      expect(doc.canonicals).toEqual([`${origin}/${locale}/drivers${canonical}`]);
      expect(doc.robots.includes('noindex')).toBe(noindex);
      if (query === '?page=2') expect(doc.title).toContain('2');
    }
    for (const route of ['/drivers/01', '/drivers/999999', '/seasons/2199', '/races/999999', '/content/drafts/ayrton-senna', '/drivers/1/article', '/drafts']) {
      const response = await request.get(`/${locale}${route}`, { headers: bot });
      expect([200, 404]).toContain(response.status());
      const doc = await inspect(page, await response.text());
      expect(doc.robots, route).toContain('noindex');
      // Next may send the fallback UI in the client stream; the existing archive
      // browser suite verifies its visible heading. The raw noindex is required.
    }
  });
}

test('sitemap and robots are root endpoints with complete, unique localized public URLs', async ({ request, page }) => {
  test.setTimeout(90000);
  const robots = await request.get('/robots.txt', { maxRedirects: 0 });
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const response = await request.get('/sitemap.xml', { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('xml');
  const xml = await response.text();
  const urls = await page.evaluate(xml => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid sitemap XML');
    return [...doc.querySelectorAll('loc')].map(node => node.textContent!);
  }, xml);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.length).toBe(246); // (7 roots + 107 drivers + 2 teams + 2 circuits + 2 seasons + 1 race + 2 entrants) × 2 locales
  for (const locale of ['uk', 'en']) {
    for (const route of ['', '/drivers/107', '/constructors/2', '/circuits/2', '/seasons/1951', '/races/1', '/entrants/2']) {
      expect(urls).toContain(`${origin}/${locale}${route}`);
    }
  }
  expect(urls.every(url => /^http:\/\/127\.0\.0\.1:3340\/(uk|en)(\/|$)/.test(url) && !/[?]|draft|article/.test(url))).toBe(true);
  expect(xml).not.toContain('<lastmod>'); // no fabricated modification dates
  for (let offset = 0; offset < urls.length; offset += 8) {
    const responses = await Promise.all(urls.slice(offset, offset + 8).map(url => request.get(url, { headers: bot, maxRedirects: 0 })));
    for (const response of responses) {
      expect(response.status(), response.url()).toBe(200);
      const doc = await inspect(page, await response.text());
      expect(doc.canonicals, response.url()).toEqual([response.url()]);
      expect(doc.robots, response.url()).not.toContain('noindex');
      expect(doc.h1, response.url()).toBeTruthy();
    }
  }
  const alias = await request.get('/drivers/1', { maxRedirects: 0 });
  expect([307, 308]).toContain(alias.status());
  expect(new URL(alias.headers().location, origin).href).toBe(`${origin}/uk/drivers/1`);
  const outage = await request.get('http://127.0.0.1:3341/sitemap.xml');
  expect(outage.status()).toBeGreaterThanOrEqual(500);
});

test('driver breadcrumbs are visible and keyboard navigable without altering the profile', async ({ page }) => {
  await page.goto('/en/drivers/1');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumbs' });
  await expect(crumbs).toBeVisible();
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('driver-a');
  const link = crumbs.getByRole('link', { name: en.UI.driversTitle, exact: true });
  await link.focus();
  const navigation = page.waitForRequest(request => request.isNavigationRequest() && request.url() === `${origin}/en/drivers`);
  await page.keyboard.press('Enter');
  expect((await navigation).method()).toBe('GET');
  await expect(page).toHaveURL(`${origin}/en/drivers`);
});
