import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const dir=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const load=f=>JSON.parse(readFileSync(new URL(f,dir),'utf8'));
const docs=[load('EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json'),load('EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json')];
const get=id=>docs.flatMap(d=>d.circuits).find(c=>c.circuit_id===id).stories;
test('20 EN/UK scenes retain independent leads and fail-closed approval',()=>{
 let count=0;
 for(const id of ['riverside','zolder','nivelles','east-london'])for(const s of get(id)){
  count++;
  assert.ok(s.narrative.en.trim().split(/\s+/).length>=65,id+'/en');
  assert.ok(s.narrative.uk.trim().split(/\s+/).length>=55,id+'/uk');
  assert.ok(new Set(s.historical_sources.map(u=>new URL(u).hostname)).size>=2,id+'/sources');
  assert.equal(s.publication,'blocked');
  assert.equal(s.independent_approval,false);
  assert.equal(s.historical_review_status,'pending_independent_claim_review');
  assert.match(s.historical_source_locator,/independent (?:human )?claim review pending/i);
 }
 assert.equal(count,20);
});
test('Riverside corrects Bonnier retirement and Gurney mechanical cause',()=>{
 assert.match(get('riverside')[1].narrative.en,/Bonnier did not retire/);
 assert.match(get('riverside')[1].narrative.uk,/класифікований п'ятим/);
 assert.doesNotMatch(get('riverside')[0].narrative.uk,/Бребгем/);
});
test('Zolder distinguishes retrospective Senna points and Prost electrical fault',()=>{
 assert.match(get('zolder')[3].narrative.en,/first point in South Africa/);
 assert.match(get('zolder')[4].narrative.en,/electrical trouble/);
 assert.doesNotMatch(get('zolder')[4].narrative.uk,/розподільником запалювання/);
});
test('Nivelles records lap 76 versus 77 discrepancy without claiming exact lap',()=>{
 const s=get('nivelles')[4];
 assert.match(s.historical_source_locator,/lap 76; Grandprix.com says lap 77/);
 assert.match(s.narrative.en,/Matra's V12 began to starve of fuel/);
});
test('East London keeps mechanical title loss separate from local point',()=>{
 assert.match(get('east-london')[1].narrative.en,/locking washer/);
 assert.match(get('east-london')[4].narrative.en,/four laps behind Hill/);
});