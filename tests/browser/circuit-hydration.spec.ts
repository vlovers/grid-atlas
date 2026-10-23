import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: repeated circuit hydration, reloads and internal navigation`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    let cycle = 0;
    let completed = false;
    const errors: object[] = [];
    const network: object[] = [];
    page.on('pageerror', error => errors.push({ cycle, url: page.url(), time: new Date().toISOString(), message: error.message, stack: error.stack }));
    page.on('console', message => {
      if (message.type() === 'error') errors.push({ cycle, url: page.url(), time: new Date().toISOString(), message: message.text() });
    });
    page.on('response', response => {
      const request = response.request();
      if (request.isNavigationRequest() || request.resourceType() === 'fetch' || response.status() >= 400) {
        network.push({ cycle, time: new Date().toISOString(), url: response.url(), status: response.status(), type: request.resourceType() });
      }
    });
    page.on('requestfailed', request => network.push({ cycle, time: new Date().toISOString(), url: request.url(), failure: request.failure() }));
    try {
      for (cycle = 1; cycle <= 30; cycle++) {
        await test.step(`cycle ${cycle}: direct load → race → circuit → reload`, async () => {
          const response = await page.goto(`/${locale}/circuits/1`);
          expect(response?.status()).toBe(200);
          if (cycle === 1) {
            const html = await response!.text();
            expect(html).toContain('<option value="2" selected="">');
            const serverIds = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map(match => match[1]);
            expect(serverIds).toHaveLength(2);
            await expect(page.getByTestId('story-header').locator('linearGradient')).toHaveCount(2);
            expect(await page.getByTestId('story-header').locator('linearGradient').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(serverIds);
          }
          await expect(page.locator('main h1')).toHaveText('100%_ Test Circuit');
          const select = page.getByTestId('circuit-layout-select');
          // Verify hydration completed through a state change, not only static SSR visibility.
          await expect(select).toHaveValue('2');
          await select.selectOption('1');
          await expect(page.getByTestId('circuit-layout-facts')).toContainText('5.123');
          await page.locator(`main a[href="/${locale}/races/1"]`).first().click();
          await expect(page).toHaveURL(`/${locale}/races/1`);
          await expect(page.locator('main h1')).toHaveText('Synthetic shared-car race');
          await page.locator(`main a[href="/${locale}/circuits/1"]`).first().click();
          await expect(page).toHaveURL(`/${locale}/circuits/1`);
          await expect(select).toHaveValue('2');
          await select.selectOption('1');
          await expect(page.getByTestId('circuit-layout-facts')).toContainText('5.123');
          expect((await page.reload())?.status()).toBe(200);
          await expect(select).toHaveValue('2');
          await select.selectOption('1');
          await expect(page.getByTestId('circuit-layout-facts')).toContainText('5.123');
          expect(errors, `cycle ${cycle}, ${page.url()}`).toEqual([]);
        });
      }
      completed = true;
    } finally {
      await testInfo.attach('hydration-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
      if (!completed) {
        await testInfo.attach('hydration-network', { body: JSON.stringify(network, null, 2), contentType: 'application/json' });
        await testInfo.attach('hydration-dom', { body: await page.content(), contentType: 'text/html' });
      }
    }
  });
}
