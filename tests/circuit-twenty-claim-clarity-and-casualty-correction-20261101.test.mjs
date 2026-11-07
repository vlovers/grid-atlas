import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const root=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const load=name=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const files=[load('EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json'),load('EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json')];
const ids=['aida','dijon','jacarepagua','montjuic'];
const get=id=>files.flatMap(doc=>doc.circuits).find(c=>c.circuit_id===id);

test('20 edited race scenes retain EN/UK, independent leads and publication block',()=>{
 let count=0;
 for(const id of ids){
  const stories=get(id).stories;
  assert.deepEqual(stories.map(s=>s.story_index),[1,2,3,4,5]);
  for(const s of stories){
   count++;
   assert.ok(s.narrative.en.trim().split(/\s+/).length>=65,id+'/en');
   assert.ok(s.narrative.uk.trim().split(/\s+/).length>=55,id+'/uk');
   assert.ok(new Set(s.historical_sources.map(u=>new URL(u).hostname)).size>=2,id+'/sources');
   assert.equal(s.publication,'blocked',id);
   assert.equal(s.independent_approval,false,id);
   assert.equal(s.historical_review_status,'pending_independent_claim_review',id);
  }
 }
 assert.equal(count,20);
});
test('Montjuic reporting identifies four deaths and does not imply Stommelen died',()=>{
 const scenes=get('montjuic').stories;
 assert.match(scenes[0].narrative.en,/Stommelen survived/);
 assert.match(scenes[0].narrative.en,/four confirmed fatalities/);
 assert.match(scenes[0].narrative.uk,/Штоммелен вижив/);
 assert.match(scenes[1].narrative.en,/crash killed four bystanders/);
 assert.doesNotMatch(scenes[1].narrative.en,/Stommelen's fatal accident/);
 assert.match(scenes[1].narrative.uk,/загинули четверо людей/);
 assert.ok(scenes[1].historical_sources.some(u=>u.includes('counting-the-cost')));
});
test('Aida tyre stock unresolved; Dijon turning point supported by independent reporting',()=>{
 for(const s of get('aida').stories.slice(3)){
  assert.match(s.historical_source_locator,/Exact tyre count disputed/);
  assert.match(s.narrative.en,/Grandprix.com/);
  assert.match(s.narrative.en,/Autosport/);
 }
 for(const s of get('dijon').stories.slice(0,2)){
  assert.ok(s.historical_sources.some(u=>u.includes('autosport.com')));
  assert.match(s.historical_source_locator,/lap-46 move/);
 }
});
