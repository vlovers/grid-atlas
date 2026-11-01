import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const read=f=>JSON.parse(readFileSync(new URL(f,root),'utf8'));
const specs=[['EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json','aida'],['EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json','dallas'],['EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json','buenos-aires'],['EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json','madring']];
const circuits=new Map(specs.map(([f,id])=>{const doc=read(f);assert.equal(doc.publication,'blocked');return [id,doc.circuits.find(c=>c.circuit_id===id)];}));
const scene=(id,n)=>circuits.get(id).stories[n-1];
test('20 scenes remain bilingual, independently source-linked and unpublished',()=>{
let count=0;for(const [id,c] of circuits){assert.ok(c,id);assert.deepEqual(c.stories.map(s=>s.story_index),[1,2,3,4,5]);for(const s of c.stories){count++;for(const l of ['en','uk'])assert.ok(s.narrative[l].trim().split(/\s+/).length>=55,id+'/'+l);assert.doesNotMatch(s.narrative.en,/[А-Яа-яІіЇїЄєҐґ]/);assert.ok(new Set(s.historical_sources.map(u=>new URL(u).hostname.replace(/^www\./,''))).size>=2);assert.equal(s.independent_approval,false);assert.equal(s.publication,'blocked');assert.equal(s.historical_review_status,'pending_independent_claim_review');}}assert.equal(count,20);});
test('four evidence boundaries and unresolved discrepancies remain explicit',()=>{
assert.match(scene('aida',4).narrative.en,/Grandprix.com.*Autosport/);
assert.match(scene('aida',5).narrative.en,/Autosport/);
assert.match(scene('dallas',3).narrative.en,/64 completed laps/);
assert.match(scene('dallas',4).historical_source_locator,/56 completed laps/);
assert.match(scene('dallas',5).narrative.en,/two championship points/);
assert.match(scene('buenos-aires',1).narrative.en,/71 or 72 laps/);
assert.match(scene('buenos-aires',1).narrative.en,/1:51:39\.531.*1:53:14\.532/);
assert.match(scene('madring',2).narrative.en,/lap 48/);
assert.match(scene('madring',3).narrative.en,/4\.351.*0\.738/);
assert.match(scene('madring',5).narrative.en,/550 metres.*24%/);
});
