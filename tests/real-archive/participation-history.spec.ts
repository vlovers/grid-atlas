import {test,expect} from '@playwright/test';
import {participationCopy} from '../../apps/web/src/components/participation/copy';
const api='http://127.0.0.1:3350/api';
type Row={year:number;related_id:string;related_name:string;races:number};
for(const locale of ['uk','en'] as const){
 test(`${locale}: McLaren 1988 calendar and changes agree with complete career API`,async({page,request,isMobile},info)=>{
  const matches=(await(await request.get(`${api}/constructors?q=mclaren&limit=5`)).json()).data;
  const identity=matches.find((r:{external_id:string})=>r.external_id==='mclaren');expect(identity).toBeTruthy();
  const career=(await(await request.get(`${api}/constructors/${identity.id}/career?locale=${locale}`)).json()).data[0];const rows:Row[]=career.participation;
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`/${locale}/constructors/${identity.id}?season=1988`);
  const timeline=page.getByTestId('constructor-lineup-timeline');await expect(timeline).toBeVisible();
  const current=rows.filter(r=>r.year===1988),previous=rows.filter(r=>r.year===1987);
  const changes=timeline.getByTestId('participation-changes');await expect(changes).toHaveAttribute('data-comparison','available');
  for(const row of current.filter(r=>!previous.some(p=>p.related_id===r.related_id)))await expect(changes).toContainText(row.related_name);
  for(const row of previous.filter(r=>!current.some(p=>p.related_id===r.related_id)))await expect(changes).toContainText(row.related_name);
  const headers=(await timeline.locator('thead th a').allTextContents()).map(Number);
  const visible=rows.filter(r=>headers.includes(r.year));
  await expect(timeline.locator('tbody td a')).toHaveCount(visible.length);
  for(const row of visible){
   const mark=timeline.locator(`tbody a[href="/${locale}/explorer/evidence/${row.related_id}/${identity.id}?year=${row.year}&from=constructor&selected=${row.related_id}"]`);
   // A calendar window boundary is not the end of an observed participation period.
   await expect(mark).toHaveAttribute('data-start',String(!rows.some(r=>r.related_id===row.related_id&&r.year===row.year-1)));
   await expect(mark).toHaveAttribute('data-end',String(!rows.some(r=>r.related_id===row.related_id&&r.year===row.year+1)));
  }
  for(const row of current){
   const cell=timeline.locator(`tbody a[href="/${locale}/explorer/evidence/${row.related_id}/${identity.id}?year=1988&from=constructor&selected=${row.related_id}"]`);
   await expect(cell).toContainText(new Intl.NumberFormat(locale).format(row.races));
  }
  await page.screenshot({path:info.outputPath(`constructor-${locale}.jpg`),fullPage:false});
  if(isMobile){await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}
 });
 test(`${locale}: Fangio gaps remain unknown instead of inferred driver changes`,async({page,request})=>{
  const matches=(await(await request.get(`${api}/drivers?q=juan-manuel-fangio&limit=5`)).json()).data;
  const identity=matches.find((r:{external_id:string})=>r.external_id==='juan-manuel-fangio');expect(identity).toBeTruthy();
  const seasons=(await(await request.get(`${api}/drivers/${identity.id}/seasons`)).json()).data.map((r:{year:number})=>r.year).sort((a:number,b:number)=>a-b);
  const year=seasons.find((y:number,i:number)=>i>0&&!seasons.includes(y-1));expect(year).toBeTruthy();
  await page.goto(`/${locale}/drivers/${identity.id}?season=${year}`);
  const changes=page.getByTestId('driver-era-rail').getByTestId('participation-changes');
  await expect(changes).toHaveAttribute('data-comparison','gap');await expect(changes).toContainText(participationCopy[locale].gap);
  await expect(changes.locator('dl')).toHaveCount(0);
 });
 test(`${locale}: dense constructor calendar exposes every recorded driver and evidence pair`,async({page,request})=>{
  const id=process.env.SMOKE_BUSY_CONSTRUCTOR!,year=Number(process.env.SMOKE_BUSY_YEAR);
  const rows:Row[]=(await(await request.get(`${api}/constructors/${id}/career?locale=${locale}`)).json()).data[0].participation;
  await page.goto(`/${locale}/constructors/${id}?season=${year}`);
  const timeline=page.getByTestId('constructor-lineup-timeline');
  const years=(await timeline.locator('thead th a').allTextContents()).map(Number);
  const count=new Set(rows.filter(row=>years.includes(row.year)).map(row=>row.related_id)).size;
  await expect(timeline.locator('tbody tr')).toHaveCount(count);expect(count).toBeGreaterThanOrEqual(34);
  await expect(timeline.getByRole('region',{name:participationCopy[locale].matrix})).toHaveAttribute('tabindex','0');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 });
}
