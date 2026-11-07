import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Monsanto 1959 and Pedralbes 1954 have 15 bilingual, period-sourced candidate sections',()=>{
 for(const [id,count] of [['monsanto',9],['pedralbes',6]]){
   const guide=candidateCornerGuides.find(g=>g.circuit_id===id);
   assert.ok(guide,id);
   assert.equal(guide.sections.length,count);
   assert.equal(guide.numbered_turns,count);
   assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:count},(_,i)=>i+1));
   assert.match(guide.numbering_basis,/NOT /);
   for(const s of guide.sections){
     assert.equal(s.name,null);
     assert.ok(s.aliases.length>0);
     assert.ok(s.explanation.en.trim().split(/\s+/).length>=24,id+':'+s.id+':en');
     assert.ok(s.explanation.uk.trim().split(/\s+/).length>=21,id+':'+s.id+':uk');
     assert.ok(s.sources.every(k=>/^https:\/\//.test(candidateCornerSources[k])),id+':'+s.id);
   }
   assert.equal(guide.review_status,'independent_review_pending');
   assert.equal(hasPublicationReadyCornerGuide(id),false);
 }
});
test('Pedralbes official first hairpin is differentiated from unverified later turn assignments',()=>{
 const p=candidateCornerGuides.find(g=>g.circuit_id==='pedralbes');
 assert.equal(p.sections[0].confirmation_status,'period_turn_location_source_checked');
 assert.ok(p.sections.slice(1).every(s=>s.confirmation_status==='historical_numbering_unverified'));
 const m=candidateCornerGuides.find(g=>g.circuit_id==='monsanto');
 assert.ok(m.sections.every(s=>s.confirmation_status==='historical_numbering_unverified'));
});
