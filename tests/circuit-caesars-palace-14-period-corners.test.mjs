import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Caesars Palace 1981–82 has fourteen individually authored bilingual corner descriptions',()=>{
 const guide=candidateCornerGuides.find(g=>g.circuit_id==='caesars-palace');
 assert.ok(guide);
 assert.equal(guide.layout_id,'caesars-palace-1');
 assert.equal(guide.numbering_year,1982);
 assert.equal(guide.sections.length,14);
 assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:14},(_,i)=>i+1));
 assert.match(guide.numbering_basis,/SECONDARY/);
 assert.match(guide.numbering_basis,/No authenticated period FIA/);
 for(const s of guide.sections){
  assert.equal(s.name,null);
  assert.equal(s.confirmation_status,'historical_numbering_unverified');
  assert.ok(s.aliases.length>0);
  assert.ok(s.explanation.en.trim().split(/\s+/).length>=34,s.id+':en');
  assert.ok(s.explanation.uk.trim().split(/\s+/).length>=25,s.id+':uk');
  assert.ok(s.sources.every(k=>/^https:\/\//.test(candidateCornerSources[k])),s.id);
 }
 assert.equal(guide.review_status,'independent_review_pending');
 assert.equal(hasPublicationReadyCornerGuide('caesars-palace'),false);
});
