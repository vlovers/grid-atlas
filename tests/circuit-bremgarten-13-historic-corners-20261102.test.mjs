import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';
test('Bremgarten 1954 contains thirteen bilingual, sourced historic reading entries without certified turn numbering', () => {
 const guide=candidateCornerGuides.find(g=>g.circuit_id==='bremgarten');
 assert.ok(guide);
 assert.equal(guide.layout_id,'bremgarten-1');
 assert.equal(guide.numbering_year,1954);
 assert.equal(guide.sections.length,13);
 assert.equal(guide.numbered_turns,13);
 assert.match(guide.numbering_basis,/not an authenticated/i);
 assert.deepEqual(guide.sections.flatMap(s=>s.numbers), Array.from({length:13},(_,i)=>i+1));
 assert.ok(guide.sections.some(s=>s.aliases.some(a=>a.includes('Tenni'))));
 assert.ok(guide.sections.some(s=>s.aliases.some(a=>a.includes('Forsthaus'))));
 for(const s of guide.sections) {
  assert.equal(s.name,null);
  assert.equal(s.confirmation_status,'historical_numbering_unverified');
  assert.ok(s.aliases.length>0);
  assert.ok(s.explanation.en.trim().split(/\s+/).length>=26,s.id+':en');
  assert.ok(s.explanation.uk.trim().split(/\s+/).length>=22,s.id+':uk');
  assert.ok(s.sources.every(key=>/^https:\/\//.test(candidateCornerSources[key])),s.id);
 }
 assert.equal(guide.review_status,'independent_review_pending');
 assert.equal(hasPublicationReadyCornerGuide('bremgarten'),false);
});