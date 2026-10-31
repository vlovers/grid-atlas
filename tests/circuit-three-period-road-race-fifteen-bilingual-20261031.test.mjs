import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const base=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const docs=['EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json','EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json'].map(name=>JSON.parse(readFileSync(new URL(name,base),'utf8')));
const claims={
  "pescara": [
    "Moss passed Musso on lap two",
    "left-rear wheel",
    "Gregory's loosening bodywork",
    "shaking bodywork",
    "Brooks's overheating car"
  ],
  "porto": [
    "Brabham had run wide",
    "McLaren's race was steadier",
    "mechanics",
    "straw bales",
    "three cylinders"
  ],
  "monaco": [
    "Panis had already overtaken",
    "borrowed Schumacher helmet",
    "Herbert made no decisive pass",
    "more than half a second",
    "Jean Alesi then led"
  ]
};
test('15 period-linked bilingual scenes retain distinct causal chronology and fail-closed publication',()=>{
 let count=0;
 for(const [id,expected] of Object.entries(claims)){
  const doc=docs.find(d=>d.circuits.some(c=>c.circuit_id===id));
  assert.equal(doc.publication,'blocked');
  const circuit=doc.circuits.find(c=>c.circuit_id===id);
  assert.equal(circuit.stories.length,5);
  for(const [i,s] of circuit.stories.entries()){
   count++;
   assert.ok(s.narrative.en.includes(expected[i]),id+':EN:'+i);
   assert.ok(s.narrative.en.trim().split(/\s+/).length>=65,id+':EN words:'+i);
   assert.ok(s.narrative.uk.trim().split(/\s+/).length>=55,id+':UK words:'+i);
   assert.equal(s.independent_approval,false);
   assert.equal(s.publication,'blocked');
   assert.equal(s.historical_review_status,'pending_independent_claim_review');
   assert.ok(s.historical_sources.length>=2);
   assert.ok(s.source_urls.some(u=>u.includes('formula1.com/en/results/')));
  }
 }
 assert.equal(count,15);
});
