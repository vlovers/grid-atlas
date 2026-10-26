import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json','utf8'));
test('20 circuit research entries remain distinct, bilingual and unpublished',()=>{
 assert.equal(data.circuits.length,20);
 assert.equal(new Set(data.circuits.map(x=>x.circuit_id)).size,20);
 assert.equal(data.status,'research_only');
 const excluded=new Set(['monaco','spa-francorchamps']);
 for(const c of data.circuits){
   assert.equal(excluded.has(c.circuit_id),false);
   assert.equal(c.publication,'unpublished');
   for(const language of ['en','uk']){
     assert.ok(c.editorial_intro[language].split(/\s+/).length>=19,c.circuit_id+'/'+language);
     assert.ok(c.moments[0].title[language].length>5);
     assert.ok(c.moments[0].narrative[language].trim().length>=60,c.circuit_id+'/'+language);
   }
   assert.ok(c.moments[0].sources?.every(s=>s.startsWith('https://www.formula1.com/')));
   assert.equal(c.moments[0].review_status,'unverified_research_draft');
   for(const turn of c.corner_names){
     assert.equal(turn.turn_number,null);
     assert.equal(turn.configuration_id,null);
     assert.equal(turn.status,'name_candidate_needs_official_number_and_layout');
   }
   assert.ok(c.research_gaps.length>=3);
 }
});
