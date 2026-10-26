import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase=process.argv[2]||'before';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3491';
const api=process.env.V3_API||'http://127.0.0.1:3480';
const dir='docs/design/product-experience-v3-final';
const data=async path=>{const r=await fetch(api+path);if(!r.ok)throw Error(`${path}: ${r.status}`);return(await r.json()).data;};
const resolve=async(kind,external)=>(await data(`/api/${kind}?q=${external}&limit=30`)).find(r=>r.external_id===external);
const senna=await resolve('drivers','ayrton-senna'), sparse=await resolve('drivers','adolfo-schwelm-cruz'), mclaren=await resolve('constructors','mclaren'), silverstone=await resolve('circuits','silverstone');
if(!senna||!sparse||!mclaren||!silverstone)throw Error('Genuine pinned archive required');
const races=await data('/api/seasons/1988/races');
const routes=[['home',''],['atlas-sparse',`atlas?kind=driver&id=${sparse.id}`],['atlas-career',`atlas?kind=driver&id=${senna.id}&year=1988`],['outside-career',`time-machine?kind=driver&id=${senna.id}&from=2025&to=2026`],['comparison',`time-machine?kind=driver&id=${senna.id}&from=1987&to=1988`],['lineage','lineage'],['stories','stories'],['driver',`drivers/${senna.id}`],['constructor',`constructors/${mclaren.id}`],['circuit',`circuits/${silverstone.id}`],['season','seasons/1988'],['race',`races/${races[0].id}`]];
await mkdir(`${dir}/screenshots`,{recursive:true});
const browser=await chromium.launch();const report=[],supplementary=[];
try{
 for(const locale of ['en','uk'])for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});
  for(const [name,path]of routes){
   const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
   const response=await page.goto(`${base}/${locale}/${path}`);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:`${dir}/screenshots/${phase}-${name}-${locale}-${width}.jpg`,type:'jpeg',quality:82});
   report.push({name,locale,width,status:response.status(),errors,...await page.evaluate(()=>({title:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,headings:[...document.querySelectorAll('main h2,main h3')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.textContent),mainText:document.querySelector('main')?.innerText,fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight,unicodeRange:f.unicodeRange}))}))});
   if(name==='circuit'){
    await page.getByTestId('circuit-experience').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/screenshots/${phase}-circuit-interaction-${locale}-${width}.jpg`,type:'jpeg',quality:84});
   }
   page.off('pageerror',listener);
  }
  await page.close();
 }
 if(phase==='after')for(const locale of ['en','uk'])for(const width of [1024,390]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  for(const [name,path]of routes.filter(([name])=>['atlas-sparse','comparison','constructor','circuit'].includes(name))){
   await page.goto(`${base}/${locale}/${path}`);await page.waitForLoadState('networkidle');
   await page.evaluate(()=>{document.documentElement.style.fontSize='200%';return document.fonts.ready;});
   if(name==='circuit'){await page.getByTestId('circuit-year-select').selectOption('1987');await page.getByTestId('circuit-experience').scrollIntoViewIfNeeded();}
   await page.screenshot({path:`${dir}/screenshots/after-${name}-${locale}-${width}-200.jpg`,type:'jpeg',quality:82});
   supplementary.push({name,locale,width,textScale:200,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,headingFont:getComputedStyle(document.querySelector('h1')).fontFamily,loadedUkrainian:document.fonts.check('500 32px "Atlas Serif"','Ґґ Єє Іі Її Україна')}))});
  }
  await page.close();
 }
}finally{await browser.close();}
await writeFile(`${dir}/${phase}-audit.json`,JSON.stringify({identities:{senna,sparse,mclaren,silverstone},pages:report,supplementary},null,2)+'\n');
console.log(`${report.length} rendered pages; ${report.filter(r=>r.overflow).length} overflows; ${report.filter(r=>r.errors.length).length} pages with errors`);
