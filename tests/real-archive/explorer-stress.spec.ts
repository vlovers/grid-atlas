import { expect, test } from '@playwright/test';

// Discovered by SQL from the pinned, real archive at CI runtime.
const busyYear = process.env.SMOKE_BUSY_YEAR;
const busyConstructor = process.env.SMOKE_BUSY_CONSTRUCTOR;
const busyDegree = Number(process.env.SMOKE_BUSY_DEGREE);
const longYear = process.env.SMOKE_LONG_YEAR;
const longDriver = process.env.SMOKE_LONG_DRIVER;
const longConstructor = process.env.SMOKE_LONG_CONSTRUCTOR;
if (!busyYear || !busyConstructor || !Number.isSafeInteger(busyDegree) || busyDegree < 1 ||
    !longYear || !longDriver || !longConstructor) {
  throw new Error('Real-archive stress selectors must be populated from PostgreSQL');
}
const MAX_API_EDGES = 25;
const MAX_SVG_EDGES = 10;

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: densest real constructor graph keeps list, SVG and truncation in sync`, async ({ page, isMobile }) => {
    await page.goto(`/${locale}/explorer/constructors/${busyConstructor}?year=${busyYear}`);
    const panel = page.getByRole('region', {
      name: locale === 'uk' ? 'Прокручувана карта зв’язків' : 'Scrollable connection map',
    });
    await expect(panel).toBeVisible();
    const graphSection = page.getByRole('region', { name: locale === 'uk'
      ? 'Карта зв’язків' : 'Connection map' });
    const expectedEdges = Math.min(busyDegree, MAX_API_EDGES);
    const fullList = graphSection.locator('ul li');
    await expect(fullList).toHaveCount(expectedEdges);
    await expect(panel.locator('svg a')).toHaveCount(Math.min(expectedEdges, MAX_SVG_EDGES));
    await expect(graphSection.getByRole('button', { pressed: true })).toHaveCount(1);

    if (expectedEdges > MAX_SVG_EDGES) {
      await expect(graphSection).toContainText(locale === 'uk'
        ? `На карті показано ${MAX_SVG_EDGES} із ${expectedEdges} зв’язків.`
        : `Map shows ${MAX_SVG_EDGES} of ${expectedEdges} links.`);
      const last = fullList.last().getByRole('button');
      const name = await last.textContent();
      await last.click();
      await expect(page).toHaveURL(/selected=[0-9]+/);
      await expect(page.getByRole('complementary', {
        name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
      }).getByRole('heading', { level: 2 })).toContainText(name?.trim() ?? '');
    }
    if (busyDegree > MAX_API_EDGES) {
      await expect(page.getByRole('status')).toContainText(
        locale === 'uk' ? 'Показано лише перших' : 'Showing only the first');
    }
    if (isMobile) {
      const width = await panel.evaluate(element => ({
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
      }));
      expect(width.scrollWidth).toBeGreaterThan(width.clientWidth);
    }
  });

  test(`${locale}: longest imported driver label remains readable outside abbreviated SVG`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/${longDriver}?year=${longYear}&selected=${longConstructor}`);
    const heading = page.getByRole('heading', { level: 1 });
    const fullName = (await heading.textContent())?.trim() ?? '';
    expect(fullName.length).toBeGreaterThan(15);
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText(fullName);
    await expect(page.getByRole('region', {
      name: locale === 'uk' ? 'Прокручувана карта зв’язків' : 'Scrollable connection map',
    })).toBeVisible();
  });
}
