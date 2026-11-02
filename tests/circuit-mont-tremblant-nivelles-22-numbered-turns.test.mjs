import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Mont-Tremblant and Nivelles have 22 individually written bilingual corners', () => {
 for(const [id,count] of [['mont-tremblant',15],['nivelles',7]]) {
  const g=candidateCornerGuides.find(g=>g.circuit_id===id);
  assert.ok(g,id);
  assert.equal(g.numbered_turns,count);
  assert.equal(g.sections.length,count);
  assert.deepEqual(g.sections.flatMap(s=>s.numbers),Array.from({length:count},(_,i)=>i+1));
  for(const s of g.sections) {
   assert.equal(s.name,null);
   assert.ok(s.aliases.length>=1);
   assert.ok(s.explanation.en.trim().split(/\s+/).length>=28,id+':en');
   assert.ok(s.explanation.uk.trim().split(/\s+/).length>=24,id+':uk');
   assert.ok(s.sources.every(key=>/^https:\/\//.test(candidateCornerSources[key])),id);
  }
  assert.equal(g.review_status,'independent_review_pending');
  assert.equal(hasPublicationReadyCornerGuide(id),false);
 }
});
test('source dating prevents modern Mont-Tremblant corners from being certified for 1968 and prevents Nivelles count disputes from disappearing', () => {
 const t=candidateCornerGuides.find(g=>g.circuit_id==='mont-tremblant');
 const n=candidateCornerGuides.find(g=>g.circuit_id==='nivelles');
 assert.match(t.numbering_basis,/2001/);
 assert.match(t.numbering_basis,/not period FIA numbering/);
 assert.match(n.numbering_basis,/seven-turn convention/);
 assert.match(n.numbering_basis,/8 or 10/);
 assert.ok(n.sections.every(s=>s.confirmation_status==='historical_numbering_unverified'));
});
