/** Browser acceptance of PRIVATE standalone 1988 editorial preview. */
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const file=process.argv[2];
if(!file) throw new Error('Usage: node scripts/check-1988-editorial-preview.mjs PATH_TO_HTML');
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(file).href);
  const buttons=page.locator('#rounds button');
  assert.equal(await buttons.count(),16,'all 16 race buttons must render');
  assert.equal(await page.locator('#total-senna').innerText(),'90');
  assert.equal(await page.locator('#total-prost').innerText(),'87');
  await page.locator('#raw').click();
  assert.equal(await page.locator('#total-senna').innerText(),'94');
  assert.equal(await page.locator('#total-prost').innerText(),'105');
  await buttons.nth(0).click();
  assert.equal(await page.locator('#selected-race').innerText(),'Brazil');
  assert.equal(await page.locator('#total-senna').innerText(),'0');
  assert.equal(await page.locator('#total-prost').innerText(),'9');
  await page.locator('#uk').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'uk');
  assert.match(await page.locator('#mode-label').innerText(),/очок/);
  await page.locator('#counted').click();
  await page.locator('#rounds button').nth(15).click();
  assert.equal(await page.locator('#total-senna').innerText(),'90');
  assert.equal(await page.locator('#total-prost').innerText(),'87');
  assert.equal(await page.locator('#chart-lines polyline').count(),2);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow,noarchive');
  assert.deepEqual(errors,[],'runtime script must not error');
  // Keyboard-only users must be able to navigate and activate the race rail.
  const firstRace=page.locator('#rounds button').first();
  await firstRace.focus();
  await page.keyboard.press('Enter');
  assert.equal(await firstRace.getAttribute('aria-pressed'),'true');
  await page.locator('#rounds button').nth(14).focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#selected-race').innerText(),'Japan');
  assert.equal(await page.locator('#rounds button').nth(14).getAttribute('aria-pressed'),'true');
  await page.locator('#rounds button').nth(15).click();
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.locator('#rounds button').count(),16,'mobile retains full round navigation');
  assert.equal(await page.locator('#uk').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#counted').getAttribute('aria-pressed'),'true');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(overflow,false,'mobile preview must not overflow horizontally');
  console.log('PASS: 1988 private preview browser interactions, both locales, both scores, mobile navigation');
} finally {
  await browser.close();
}
