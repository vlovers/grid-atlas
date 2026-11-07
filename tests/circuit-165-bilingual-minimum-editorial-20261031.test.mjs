import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const names=["EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json","EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json","EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json","EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json","EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json","EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json"];
test('all 165 expansion scenes have substantive EN/UK copy and remain blocked',()=>{
 const docs=names.map(n=>JSON.parse(readFileSync(new URL(n,root),'utf8')));
 const circuits=docs.flatMap(d=>{assert.equal(d.publication,'blocked');return d.circuits;});
 assert.equal(circuits.length,33);
 assert.equal(new Set(circuits.map(c=>c.circuit_id)).size,33);
 let count=0;
 for(const c of circuits){assert.deepEqual(c.stories.map(s=>s.story_index),[1,2,3,4,5]);for(const s of c.stories){
 count++;
 assert.ok(s.narrative.en.trim().split(/\s+/).length>=65,c.circuit_id+'/EN/'+s.story_index);
 assert.ok(s.narrative.uk.trim().split(/\s+/).length>=55,c.circuit_id+'/UK/'+s.story_index);
 assert.ok(!/[А-Яа-яІіЇїЄєҐґ]/.test(s.narrative.en),c.circuit_id+'/EN script');
 assert.equal(s.independent_approval,false);assert.equal(s.publication,'blocked');
 }}assert.equal(count,165);
});
