import { test, expect } from '@playwright/test';
const api=process.env.V3_API||'http://127.0.0.1:3350';
for (const locale of ['en','uk'] as const) {
  for (const [kind,external] of [ ['drivers','ayrton-senna'],['drivers','lewis-hamilton'],['drivers','max-verstappen'],['constructors','ferrari'],['constructors','mclaren'],['circuits','silverstone'],['circuits','monaco'],['circuits','spa-francorchamps'],['circuits','monza'] ]) {
    test(`${locale}: ${external} remains readable, sourced and navigable at 200%`,async ({page,request})=>{
      const response=await request.get(`${api}/api/${kind}?q=${external}&limit=50`); expect(response.ok()).toBe(true);
      const entity=(await response.json()).data.find((r:{external_id:string})=>r.external_id===external); expect(entity).toBeTruthy();
      const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
      const r=await page.goto(`/${locale}/${kind}/${entity.id}`);expect(r?.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading',{level:1})).toHaveText(entity.name);
      await expect(page.locator('head title')).not.toHaveText(/undefined|404|Error/);
      expect(await page.evaluate((sample)=>document.fonts.check('500 48px "Atlas Serif"',sample),locale==='uk'?'Історія ї ґ є':'History')).toBe(true);
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const identity=page.getByTestId('identity-facts');
      await identity.locator(':scope > details > summary').click();
      await expect(identity.getByText(entity.external_id,{exact:false}).first()).toBeVisible();
      const fields=identity.locator(':scope > details > details');
      if (await fields.count()) { await fields.locator('summary').click();await expect(fields.locator('code').first()).toBeVisible(); }
      expect(errors).toEqual([]);
      if(kind==='drivers') {
        const chart=page.getByTestId('driver-season-chart');
        await expect(chart).toContainText(locale==='uk'?'Спільна шкала':'Shared scale');
        await chart.locator('details > summary').click();
        await expect(chart.getByRole('table')).toBeVisible();
        const seasonApi=await (await request.get(`${api}/api/drivers/${entity.id}/seasons`)).json();
        expect(await chart.getByRole('table').locator('tbody tr').count()).toBe(seasonApi.data.length);
        const first=[...seasonApi.data].sort((a,b)=>a.year-b.year)[0];
        await expect(chart.getByRole('table').locator('tbody tr').first()).toContainText(String(first.year));
        await expect(chart.getByRole('table').locator('tbody tr').first().locator('td')).toHaveText([String(first.starts),String(first.wins),String(first.podiums)]);
        const zeroBars=chart.locator('[aria-hidden=true] > span[style*="0%"]');
        for(const bar of await zeroBars.all()) {const height=await bar.evaluate(el=>el.getBoundingClientRect().height);const style=await bar.getAttribute('style');if(/height:\s*0%/.test(style??''))expect(height).toBe(0);}
      }
    });
  }
  test(`${locale}: unified tools preserve focus, readable covers and motion preference`,async ({page})=>{
    for (const path of ['atlas?kind=driver&id=3','time-machine?kind=driver&id=72&from=1987&to=1988','stories','lineage']) {
      await page.goto(`/${locale}/${path}`); await page.waitForLoadState('networkidle');
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
      const clipped=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('main h1,main h2,main h3')].filter(el=>el.getBoundingClientRect().height>0&&['hidden','clip'].includes(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2).map(el=>el.textContent));
      expect(clipped,path).toEqual([]);
      expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length)).toBe(0);
      await page.getByRole('link',{name:locale==='uk'?'До вмісту':'Skip to content',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
      await page.evaluate(()=>document.documentElement.style.fontSize='');
    }
  });
}
