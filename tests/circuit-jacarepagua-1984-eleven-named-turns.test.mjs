import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Jacarepagua has eleven 1984 map-numbered EN/UK corners with ten evidence-linked names',()=>{
 const g=candidateCornerGuides.find(g=>g.circuit_id==='jacarepagua');
 assert.ok(g);assert.equal(g.layout_id,'jacarepagua-1');
 assert.equal(g.numbering_year,1984);
 assert.equal(g.numbered_turns,11);
 assert.deepEqual(g.sections.flatMap(s=>s.numbers),Array.from({length:11},(_,i)=>i+1));
 assert.deepEqual(g.sections.map(s=>s.name),['Molykote','Carlos Pace','Suspiro','Nonato','Norte','Sul','Girão','Morette','Lagoa',null,'Vitória']);
 for(const s of g.sections){
   assert.ok(s.explanation.en.trim().split(/\s+/).length>=30,s.id+':en');
   assert.ok(s.explanation.uk.trim().split(/\s+/).length>=25,s.id+':uk');
   assert.ok(s.sources.every(key=>/^https:\/\//.test(candidateCornerSources[key])),s.id);
   assert.ok(s.confirmation_status.startsWith('period_numbered_map_'));
 }
 assert.match(g.numbering_basis,/Verify layout compatibility/);
 assert.equal(g.review_status,'independent_review_pending');
 assert.equal(hasPublicationReadyCornerGuide('jacarepagua'),false);
});
test('1984 historic numbered PDF stays an external evidence link, not a re-licensed media asset',()=>{
 const g=candidateCornerGuides.find(g=>g.circuit_id==='jacarepagua');
 assert.match(g.numbering_basis,/never copied, licensed or embedded/);
 assert.match(candidateCornerSources['jacarepagua-1984-numbered-map'],/^https:\/\/.+\.pdf$/);
});
