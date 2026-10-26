import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json','utf8'));
test('20 circuit research entries remain distinct, bilingual and unpublished',()=>{
 assert.equal(data.circuits.length,20);
 assert.equal(new Set(data.circuits.map(x=>x.circuit_id)).size,20);
 assert.equal(data.status,'research_only');
 assert.equal(data.circuits.reduce((count,c)=>count+c.moments.length,0),35);
 const excluded=new Set(['monaco','spa-francorchamps']);
 for(const c of data.circuits){
   assert.equal(excluded.has(c.circuit_id),false);
   assert.equal(c.publication,'unpublished');
   for(const language of ['en','uk']){
     assert.ok(c.editorial_intro[language].trim().length>=95,c.circuit_id+'/'+language);
     assert.ok(c.moments[0].title[language].length>5);
     assert.ok(c.moments[0].narrative[language].trim().length>=60,c.circuit_id+'/'+language);
   }
   assert.ok(c.moments[0].sources?.every(s=>s.startsWith('https://www.formula1.com/')));
   for(const moment of c.moments){
     assert.ok(['unverified_research_draft','source_checked_research_draft','official_classification_checked_interpretation_pending'].includes(moment.review_status));
     assert.ok(moment.sources?.every(url => url.startsWith('https://www.formula1.com/')));
     for(const lang of ['en','uk']) assert.ok(moment.narrative[lang]?.trim().length>=60,c.circuit_id+'/'+moment.year+'/'+lang);
   }
   for(const turn of c.corner_names){
     assert.equal(turn.turn_number,null);
     assert.equal(turn.configuration_id,null);
     assert.equal(turn.status,'name_candidate_needs_official_number_and_layout');
   }
   assert.ok(c.research_gaps.length>=3);
 }
});
