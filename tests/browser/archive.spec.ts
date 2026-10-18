import { test, expect } from '@playwright/test';

test('search preserves query across pages and resets to page one on submit', async ({ page }) => {
  await page.goto('/drivers?q=Synthetic');
  await expect(page.locator('.driver-grid > a')).toHaveCount(100);
  await page.getByRole('link', { name: 'Следующая →' }).click();
  await expect(page).toHaveURL(/q=Synthetic&page=2/);
  await expect(page.locator('.driver-grid > a')).toHaveCount(5);
  await page.getByLabel('Поиск по имени или идентификатору F1DB').fill('driver-a');
  await page.getByRole('button', { name: 'Найти', exact: true }).click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.locator('.driver-grid > a')).toHaveCount(1);
  await page.locator('.driver-grid > a').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('driver-a');
});

test('empty search is clear and can be reset', async ({ page }) => {
  await page.goto('/constructors?q=no-match');
  await expect(page.getByText('Совпадений нет.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Сбросить поиск' }).click();
  await expect(page.locator('.driver-grid > a')).toHaveCount(2);
});

test('circuit → named race → driver and constructor is navigable', async ({ page }, testInfo) => {
  await page.goto('/circuits?q=circuit-fixture');
  await page.locator('.driver-grid > a').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('100%_ Test Circuit');
  await page.getByRole('link', { name: /Synthetic shared-car race/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synthetic shared-car race');
  await expect(page.getByText('Общий автомобиль')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'driver-a ↗' })).toHaveAttribute('href', '/drivers/1');
  await expect(page.getByRole('link', { name: 'alpha ↗', exact: true }).first()).toHaveAttribute('href', '/constructors/1');
  await page.screenshot({ path: testInfo.outputPath('race.png'), fullPage: true });
  await page.getByRole('link', { name: '← Сезон 1950' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Сезон 1950');
});

test('missing numeric profiles show not-found and outages show retry', async ({ page }) => {
  for (const path of ['/drivers/999999', '/constructors/999999', '/entrants/999999', '/circuits/999999', '/races/999999', '/seasons/2199']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  }
  await page.goto('http://127.0.0.1:3341/drivers');
  await expect(page.getByRole('heading', { name: 'Не удалось загрузить данные' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

test('source page shows the registered release and attribution', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Источники и покрытие архива ↗' }).click();
  await expect(page.getByRole('heading', { name: /SYNTHETIC.*vfixture/ })).toBeVisible();
  await expect(page.getByText('a'.repeat(64), { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
});

test('lineage map can select evidence, zoom and retain a readable surface', async ({ page }) => {
  await page.goto('/lineage');
  await page.getByRole('button', { name: 'Карта связей', exact: true }).click();
  await page.getByRole('button', { name: 'alpha → beta, Переименование' }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Подробности исторического перехода' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'verified fixture ↗' })).toBeVisible();
  await page.getByRole('button', { name: 'Увеличить масштаб' }).click();
  await expect(page.getByText('Масштаб 125%')).toBeVisible();
  const background = await page.locator('svg rect').first().evaluate(node => getComputedStyle(node).fill);
  expect(background).toBe('rgb(20, 27, 34)');
  const lineEnd = Number(await page.locator('svg line').first().getAttribute('x2'));
  const targetX = Number(await page.locator('svg rect').nth(1).getAttribute('x'));
  expect(lineEnd).toBeLessThan(targetX);
});

test('navigation and content fit the viewport while tables and maps scroll locally', async ({ page }) => {
  for (const path of ['/', '/drivers', '/constructors', '/circuits/1', '/races/1', '/sources', '/lineage']) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
  await expect(page.getByRole('navigation', { name: 'Главная навигация' }).getByRole('link', { name: 'Трассы' })).toBeVisible();
});
