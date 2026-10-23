import { test,expect } from '@playwright/test';
import { participationCopy } from '../../apps/web/src/components/participation/copy';
import { mediaCollectionCopy } from '../../apps/web/src/components/media/collection-copy';

for(const locale of ['uk','en'] as const){
 const t=participationCopy[locale];
 test(`${locale}: driver and constructor calendars open exact evidence with keyboard`,async({page,request})=>{
  for(const kind of ['driver','constructor'] as const){
   const plural=kind==='driver'?'drivers':'constructors';
   await page.goto(`/${locale}/${plural}/1?season=1950`);
   const timeline=page.getByTestId(kind==='driver'?'driver-era-rail':'constructor-lineup-timeline');
   await expect(timeline.getByRole('heading',{level:3})).toBeVisible();
   await expect(timeline.getByTestId('participation-changes')).toHaveAttribute('data-comparison','first');
   const career=(await (await request.get(`http://127.0.0.1:3339/api/${plural}/1/career?locale=${locale}`)).json()).data[0];
   const identities=new Set(career.participation.map((row:{related_id:string})=>row.related_id));
   await expect(timeline.locator('tbody tr')).toHaveCount(identities.size);
   const evidence=timeline.locator('tbody td a');
   await expect(evidence).toHaveCount(career.participation.length);
   const href=await evidence.first().getAttribute('href');
   expect(href).toContain(`year=1950&from=${kind}&selected=`);
   await evidence.first().press('Enter');
   await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/evidence/`));
   await expect(page.getByRole('link',{name:/Synthetic shared-car race/}).first()).toBeVisible();
  }
 });
 test(`${locale}: calendar periods and all seasons remain native disclosures`,async({page})=>{
  await page.goto(`/${locale}/drivers/1?season=1950`);
  const timeline=page.getByTestId('driver-era-rail');
  const all=timeline.locator('details').filter({has:page.locator('summary').filter({hasText:t.all})});
  await all.locator('summary').press('Enter');
  await expect(timeline.getByRole('navigation',{name:t.all})).toBeVisible();
  await timeline.getByText(t.boundaries,{exact:false}).press('Enter');
  await expect(timeline.getByRole('link',{name:/Synthetic shared-car race/}).first()).toBeVisible();
  await expect(page.getByTestId('career-milestone-chronology').locator('ol li')).toHaveCount(1);
  await expect(all).toHaveCount(1);
 });
 test(`${locale}: empty histories and missing imagery stay explicit at 200 percent text`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
  for(const [path,testId] of [['drivers/3','driver-era-rail'],['constructors/2','constructor-lineup-timeline']] as const){
   await page.goto(`/${locale}/${path}`);
   const timeline=page.getByTestId(testId);await expect(timeline).toContainText(t.empty);
   await expect(timeline.locator('table')).toHaveCount(0);await expect(timeline.locator('a[href*="/races/"]')).toHaveCount(0);
   await expect(page.getByTestId('media-collection')).toContainText(mediaCollectionCopy[locale].empty);
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
   expect(await page.locator('main').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
  }
 });
}
