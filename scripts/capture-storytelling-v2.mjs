import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2];
if (!['before','after'].includes(phase)) throw new Error('Use before or after');
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:3471';
const api = process.env.PREVIEW_API || 'http://127.0.0.1:3470';
const output = new URL('../docs/design/visual-storytelling-v2/', import.meta.url);
await mkdir(new URL('screenshots/',output),{recursive:true});
const resolve = async (kind,slug) => {
 const response=await fetch(`${api}/api/${kind}?q=${slug}&limit=5`);
 if(!response.ok)throw Error(`${kind}: ${response.status}`);
 const item=(await response.json()).data.find(row=>row.external_id===slug);
 if(!item)throw Error(`Missing identity ${slug}`);return item.id;
};
const routes=[['senna',`/drivers/${await resolve('drivers','ayrton-senna')}?season=1988`,'#driver-career'],['mclaren',`/constructors/${await resolve('constructors','mclaren')}?season=1988`,'#constructor-season']];
const browser=await chromium.launch();const results=[];
try{
 for(const locale of ['uk','en'])for(const width of [1440,1920,1024,390]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});
  for(const [subject,route,anchor] of routes){
   const errors=[],external=[];page.removeAllListeners('pageerror');page.removeAllListeners('request');
   page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(new URL(r.url()).origin!==origin)external.push(r.url());});
   const response=await page.goto(`${origin}/${locale}${route}`);await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');
   await page.locator(anchor).scrollIntoViewIfNeeded();
   const file=`${phase}-${subject}-${locale}-${width}.jpg`;await page.screenshot({path:new URL(`screenshots/${file}`,output).pathname,type:'jpeg',quality:84});
   if(phase==='after')await page.locator(subject==='senna'?'[data-testid="driver-era-rail"]':'[data-testid="constructor-lineup-timeline"]').screenshot({path:new URL(`screenshots/${phase}-${subject}-${locale}-${width}-timeline.jpg`,output).pathname,type:'jpeg',quality:84});
   results.push({subject,locale,width,path:`/${locale}${route}`,status:response.status(),file,errors,external,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)});
  }
  await page.close();
 }
}finally{await browser.close();}
await writeFile(new URL(`${phase}.json`,output),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({phase,viewportScreenshots:results.length,sectionScreenshots:phase==='after'?results.length:0,failures:results.filter(r=>r.status!==200||r.errors.length||r.external.length||r.overflow>1)},null,2));
if(results.some(r=>r.status!==200||r.errors.length||r.external.length||r.overflow>1))process.exitCode=1;
