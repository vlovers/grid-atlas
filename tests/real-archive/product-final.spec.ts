import { chooseCircuitOption, expectCircuitValue } from '../browser/circuit-select-option';
import {test,expect,type APIRequestContext} from '@playwright/test';
import {glossary} from '../../apps/web/src/content/glossary';
const api=process.env.V3_API||'http://127.0.0.1:3350';
async function data(request:APIRequestContext,path:string){const r=await request.get(api+path);expect(r.ok(),path).toBe(true);return(await r.json()).data;}
async function identity(request:APIRequestContext,kind:string,external:string){const rows=await data(request,`/api/${kind}?q=${external}&limit=40`);const row=rows.find((r:{external_id:string})=>r.external_id===external);expect(row).toBeTruthy();return row;}
for(const locale of ['en','uk']as const){
 const words=glossary[locale];
 test(`${locale}: sparse Atlas explains its actual focus and season/career scope`,async({page,request})=>{
  const subject=await identity(request,'drivers','adolfo-schwelm-cruz');
  const [career]=await data(request,`/api/drivers/${subject.id}/career?locale=${locale}`);
  await page.goto(`/${locale}/atlas?kind=driver&id=${subject.id}`);
  await expect(page.getByRole('heading',{level:1})).toHaveAccessibleName(subject.name);
  await expect(page.getByTestId('atlas-focus-facts').getByRole('definition')).toHaveText(['1','1','1']);
  expect(career.summary.seasons).toBe(1);expect(career.summary.races).toBe(1);
  await expect(page.getByTestId('atlas-record-count')).toContainText('1');
  await expect(page.getByTestId('atlas-career-overview')).toContainText('1953');
  await expect(page.getByTestId('atlas-canvas').locator('.react-flow__node')).toHaveCount(2);
  await expect(page).toHaveTitle(/Atlas|Атлас/);
 });
 test(`${locale}: dense Atlas separates total season evidence from the loaded graph slice`,async({page,request})=>{
  const team=await identity(request,'constructors','cooper');
  const [career]=await data(request,`/api/constructors/${team.id}/career?locale=${locale}`);
  const season=career.participation.filter((r:{year:number})=>r.year===1960);
  expect(season.length).toBeGreaterThan(25);
  await page.goto(`/${locale}/atlas?kind=constructor&id=${team.id}&year=1960`);
  await expect(page.getByTestId('atlas-focus-facts').getByRole('definition').nth(1)).toHaveText(String(season.length));
  await expect(page.getByTestId('atlas-record-count')).toContainText(`${season.length}`);
  await expect(page.getByTestId('atlas-record-count')).toContainText('25');
  await expect(page.locator('#atlas-connections > ol > li')).toHaveCount(25);
 });
 test(`${locale}: Time Machine names actual constructor changes and moves between adjacent recorded pairs`,async({page,request})=>{
  const driver=await identity(request,'drivers','ayrton-senna');
  const oldTeam=await identity(request,'constructors','lotus'),newTeam=await identity(request,'constructors','mclaren');
  await page.goto(`/${locale}/time-machine?kind=driver&id=${driver.id}&from=2025&to=2026`);
  await expect(page.getByTestId('comparison-period-notice')).toContainText(words.outside);
  await expect(page.getByTestId('comparison-career')).toContainText('1984–1994');
  const choice=page.getByRole('navigation',{name:words.suggestions}).locator('a[href*="from=1987"][href*="to=1988"]');
  await expect(choice).toContainText(oldTeam.name);await expect(choice).toContainText(newTeam.name);
  await choice.focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/from=1987&to=1988/);
  const comparisons=await data(request,`/api/explorer/drivers/${driver.id}/compare?fromYear=1987&toYear=1988`);
  expect(comparisons.removed.map((r:{entity_id:string})=>r.entity_id)).toContain(oldTeam.id);
  expect(comparisons.added.map((r:{entity_id:string})=>r.entity_id)).toContain(newTeam.id);
  const neighbors=page.getByRole('navigation',{name:locale==='uk'?'Сусідні порівняння':'Neighboring comparisons'});
  await neighbors.getByRole('link').filter({hasText:words.nextPair}).focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`id=${driver.id}&from=1988&to=1989`));
  await expect(page.getByTestId('comparison-period-notice')).toHaveCount(0);
 });
 test(`${locale}: Lineage starting points search canonical constructors without claiming legal continuity`,async({page,request})=>{
  const claims=await data(request,'/api/lineage/network');expect(claims).toEqual([]);
  const team=await identity(request,'constructors','mclaren');
  await page.goto(`/${locale}/lineage`);
  await expect(page.getByTestId('lineage-reviewed-empty')).toContainText(words.lineageEmptyNote);
  const start=page.getByRole('navigation',{name:words.startConstructor});
  await start.getByRole('link',{name:'McLaren ↗',exact:true}).click();
  await expect(page).toHaveURL(/q=McLaren/);
  await expect(page.getByTestId('lineage-archive-search').locator(`a[href="/${locale}/constructors/${team.id}"]`)).toBeVisible();
  await expect(page.locator('.lineage-edge')).toHaveCount(0);
 });
 test(`${locale}: compact circuit records preserve exact event facts, outline selection and source hashes`,async({page,request})=>{
  const circuit=await identity(request,'circuits','silverstone');
  const events=await data(request,`/api/circuits/${circuit.id}/technical-history`);
  const event=events.find((e:{season_year:number})=>e.season_year===1987);expect(event).toBeTruthy();
  await page.goto(`/${locale}/circuits/${circuit.id}`);
  const experience=page.getByTestId('circuit-experience'),records=experience.getByTestId('circuit-event-data');
  await expect(records).not.toHaveAttribute('open');
  await records.locator(':scope > summary').focus();await page.keyboard.press('Enter');
  await expect(records.getByRole('table')).toBeVisible();
  await chooseCircuitOption(experience.getByTestId('circuit-year-select'), '1987');
  await expect(records).toHaveAttribute('open','');
  await expectCircuitValue(experience.getByTestId('circuit-layout-select'), event.layout_id);
  const row=records.locator(`tr[data-race-id="${event.race_id}"]`);
  await expect(row.locator('td').nth(1)).toHaveText(`${event.course_length_km} km`);
  await expect(row.locator('td').nth(2)).toHaveText(String(event.turns));
  await expect(row.locator('td').nth(3)).toHaveText(String(event.laps));
  await expect(row.locator('td').nth(4)).toHaveText(`${event.distance_km} km`);
  await row.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(row.locator('code').nth(1)).toHaveText(event.content_hash);
  const comparison=experience.getByTestId('circuit-layout-comparison');
  await expect(comparison).not.toHaveAttribute('open');
  await comparison.locator(':scope > summary').focus();await page.keyboard.press('Enter');
  await expect(comparison.getByRole('table')).toBeVisible();
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`${locale}: detailed constructor records expand by keyboard without repeating the full tables initially`,async({page,request})=>{
  const team=await identity(request,'constructors','mclaren');
  const rows=await data(request,`/api/constructors/${team.id}/championships`);
  await page.goto(`/${locale}/constructors/${team.id}`);
  const championships=page.getByTestId('championship-constructors-career');
  await expect(championships).toBeVisible();
  await expect(championships.getByRole('table')).toHaveCount(0);
  await championships.locator(':scope > details > summary').filter({hasText:locale==='uk'?'Усі сезони в заліку':'Every season in the standings'}).focus();await page.keyboard.press('Enter');
  await expect(championships.getByRole('table').locator('tbody tr')).toHaveCount(rows.length);
  const archive=page.locator('#constructor-archive');
  await expect(archive.locator(':scope > details')).not.toHaveAttribute('open');
  await archive.locator(':scope > details > summary').press('Enter');
  await expect(archive.getByRole('table').first()).toBeVisible();
 });
 test(`${locale}: a genuine single-race career reads naturally and reaches interaction before repeated milestones`,async({page,request})=>{
  const sparse=await identity(request,'drivers','adolfo-schwelm-cruz');
  await page.goto(`/${locale}/drivers/${sparse.id}`);
  const overview=page.getByTestId('driver-archive-overview');
  await expect(overview).toContainText(locale==='uk'?'1 гонку':'1 distinct race');
  await expect(overview).toContainText(locale==='uk'?'у 1953 році':'in 1953');
  await expect(overview).not.toContainText(locale==='uk'?'1 гонок':'1 distinct races');
  const positions=await page.evaluate(()=>({career:document.getElementById('driver-career')!.getBoundingClientRect().top,opening:document.querySelector('[data-testid=driver-opening]')!.getBoundingClientRect().top}));
  expect(positions.career).toBeLessThan(positions.opening);
 });
}
