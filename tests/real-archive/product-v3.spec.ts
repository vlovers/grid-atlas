import { test, expect, type APIRequestContext } from '@playwright/test';
import { glossary } from '../../apps/web/src/content/glossary';
import { historyAtlasCopy } from '../../apps/web/src/components/history-atlas/copy';
const api = process.env.V3_API || 'http://127.0.0.1:3350';
async function identity(request: APIRequestContext, kind: string, external: string) {
  const r = await request.get(`${api}/api/${kind}?q=${external}&limit=50`);
  expect(r.ok()).toBe(true);
  const row = (await r.json()).data.find((r: {external_id:string}) => r.external_id === external);
  expect(row, `${external} must come from genuine pinned import`).toBeTruthy();
  return row;
}
for (const locale of ['en','uk'] as const) {
  const t = glossary[locale];
  test(`${locale}: outside-career comparison keeps URL and offers genuine Senna transitions`, async ({page,request}) => {
    const senna = await identity(request,'drivers','ayrton-senna');
    await page.goto(`/${locale}/time-machine?kind=driver&id=${senna.id}&from=2025&to=2026`);
    await expect(page.getByTestId('comparison-period-notice')).toContainText(t.outside);
    await expect(page.getByTestId('comparison-career')).toContainText('1984–1994');
    await expect(page).toHaveURL(/from=2025&to=2026/);
    const suggestion = page.getByRole('navigation',{name:t.suggestions}).getByRole('link').filter({hasText:'1987 → 1988'});
    await suggestion.click();
    await expect(page).toHaveURL(/from=1987&to=1988/);
    const comparison = await (await request.get(`${api}/api/explorer/drivers/${senna.id}/compare?fromYear=1987&toYear=1988`)).json();
    const lotusIdentity = await identity(request,'constructors','lotus');
    expect(comparison.data.removed.map((r:{entity_id:string})=>r.entity_id)).toContain(lotusIdentity.id);
    const mclarenIdentity = await identity(request,'constructors','mclaren');
    expect(comparison.data.added.map((r:{entity_id:string})=>r.entity_id)).toContain(mclarenIdentity.id);
    await expect(page.getByTestId('comparison-period-notice')).toHaveCount(0);
    await page.locator('button').filter({hasText:mclarenIdentity.name}).click();
    await expect(page.getByRole('heading',{name:mclarenIdentity.name,exact:true}).first()).toBeVisible();
    const evidence = page.locator('main a[href*="/explorer/evidence/"]');
    expect(await evidence.count()).toBeGreaterThan(0);
    const href = await evidence.first().getAttribute('href');
    expect(href).toContain('year=1988');
    await page.goto(href!);
    await expect(page.getByRole('table')).toBeVisible();
    await page.getByRole('table').getByRole('link').first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/races/`));
  });
  test(`${locale}: selecting an identity defaults to recorded seasons rather than current years`,async ({page,request})=>{
    const senna = await identity(request,'drivers','ayrton-senna');
    await page.goto(`/${locale}/time-machine`);
    await page.locator('input[name=q]').fill('ayrton-senna');
    await page.locator('form').filter({has:page.locator('input[name=q]')}).getByRole('button').click();
    await page.getByRole('link').filter({hasText:senna.name}).click();
    await expect(page.getByTestId('comparison-career')).toContainText(senna.name);
    const from = page.locator('input[name=from][type=number]');
    const to = page.locator('input[name=to][type=number]');
    expect(Number(await from.inputValue())).toBeGreaterThanOrEqual(1984);
    expect(Number(await to.inputValue())).toBeLessThanOrEqual(1994);
    expect(Number(await from.inputValue())).toBeLessThan(Number(await to.inputValue()));
  });
  test(`${locale}: lineage searches the actual constructor catalogue beside honest reviewed empty state`,async ({page,request})=>{
    const network = await (await request.get(`${api}/api/lineage/network`)).json();
    await page.goto(`/${locale}/lineage`);
    if (!network.data.length) await expect(page.getByTestId('lineage-reviewed-empty')).toContainText(t.lineageEmptyNote);
    const search = page.getByTestId('lineage-archive-search');
    await search.locator('input[name=q]').fill('Ferrari');
    await search.getByRole('button',{name:locale==='uk'?'Знайти ↗':'Search ↗'}).press('Enter');
    await expect(page).toHaveURL(/q=Ferrari/);
    const ferrari = await identity(request,'constructors','ferrari');
    await expect(search.locator(`a[href="/${locale}/constructors/${ferrari.id}"]`)).toBeVisible();
    await search.locator(`a[href="/${locale}/atlas?kind=constructor&id=${ferrari.id}"]`).click();
    await expect(page.getByTestId('history-atlas')).toBeVisible();
    const hamilton=await identity(request,'drivers','lewis-hamilton');
    const careerSearch=page.getByTestId('atlas-career-overview');
    await careerSearch.locator('input[name=careerQ]').fill('Hamilton');
    await careerSearch.getByRole('button').click();
    await expect(careerSearch).toContainText(hamilton.name);
  });
  test(`${locale}: Atlas shows all recorded career constructors, exact years and a complete single-race history`,async ({page,request})=>{
    const senna = await identity(request,'drivers','ayrton-senna');
    await page.goto(`/${locale}/atlas?kind=driver&id=${senna.id}&year=1988`);
    const overview = page.getByTestId('atlas-career-overview');
    const teams=await Promise.all(['toleman','lotus','mclaren','williams'].map(external=>identity(request,'constructors',external)));
    for (const team of teams) await expect(overview.getByRole('heading',{name:team.name,exact:true})).toBeVisible();
    const lotus = overview.getByRole('listitem').filter({has:page.getByRole('heading',{name:teams[1].name,exact:true})});
    await lotus.locator('summary').click();
    await expect(lotus.locator('a[href*="year=1987"]')).toHaveCount(2);
    const single = await identity(request,'drivers','adolfo-schwelm-cruz');
    await page.goto(`/${locale}/atlas?kind=driver&id=${single.id}`);
    await expect(page.getByTestId('history-atlas')).toContainText('1953');
    await expect(page.getByTestId('atlas-career-overview').getByRole('heading',{level:3})).toHaveCount(1);
    await expect(page.getByTestId('atlas-career-overview')).toContainText('1953');
  });
  test(`${locale}: dense Atlas expands neighbor windows and exposes complete pagination without changing evidence`,async ({page,request,isMobile})=>{
    const cooper = await identity(request,'constructors','cooper');
    await page.goto(`/${locale}/atlas?kind=constructor&id=${cooper.id}&year=1960`);
    const atlas=page.getByTestId('history-atlas');
    await expect(atlas.locator('#atlas-connections').getByRole('listitem')).toHaveCount(25);
    await expect(page.getByTestId('atlas-canvas').locator('.react-flow__node')).toHaveCount(isMobile?3:9);
    await atlas.getByRole('button',{name:historyAtlasCopy[locale].nextMap,exact:true}).click();
    await expect(atlas).toContainText(`${historyAtlasCopy[locale].window} 2 /`);
    await atlas.locator('#atlas-connections').getByRole('button').last().click();
    await expect(page).toHaveURL(/selected=/);
    const selected = new URL(page.url()).searchParams.get('selected');
    await expect(page.getByTestId('atlas-canvas').locator(`[data-id="driver:${selected}"]`)).toBeVisible();
    const career=page.getByTestId('atlas-career-overview');
    await career.getByRole('link',{name:t.next+' →',exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`selected=${selected}`));
    await expect(page).toHaveURL(/careerPage=1/);
    const secondSelection=page.getByTestId('history-atlas').locator('#atlas-connections').getByRole('button').first();
    await secondSelection.click();
    await expect(page).toHaveURL(/careerPage=1/);
    const currentSelection=new URL(page.url()).searchParams.get('selected');
    await career.getByRole('link',{name:'← '+t.previous,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`selected=${currentSelection}`));
    await atlas.getByRole('link',{name:historyAtlasCopy[locale].all+' ↗',exact:true}).click();
    await expect(page).toHaveURL(/\/explorer\/connections\/constructors\//);
    const next = page.locator('a[href*="offset=25"]');
    await expect(next).toBeVisible(); await next.click();
    await expect(page).toHaveURL(/offset=25/);
  });
  test(`${locale}: reading at 200% keeps long labels, sources and keyboard controls within the viewport`,async ({page,request})=>{
    const senna = await identity(request,'drivers','ayrton-senna');
    for (const path of ['lineage',`atlas?kind=driver&id=${senna.id}&year=1988`,`time-machine?kind=driver&id=${senna.id}&from=1987&to=1988`,'stories','constructors']) {
      await page.goto(`/${locale}/${path}`);
      await page.waitForLoadState('networkidle');
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
      await page.getByRole('link',{name:locale==='uk'?'До вмісту':'Skip to content',exact:true}).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
      await page.evaluate(()=>document.documentElement.style.fontSize='');
    }
  });
}
