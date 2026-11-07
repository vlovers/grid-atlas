import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Riverside 1960 and Bugatti 1967 are 23 separate period-bound bilingual candidate corners', () => {
  for (const [id, count, year] of [['riverside',9,1960],['bugatti',14,1967]]) {
    const guide = candidateCornerGuides.find(g=>g.circuit_id===id);
    assert.ok(guide,id);
    assert.equal(guide.numbered_turns,count);
    assert.equal(guide.sections.length,count);
    assert.equal(guide.numbering_year,year);
    assert.match(guide.numbering_basis,/NOT an authenticated/);
    assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:count},(_,i)=>i+1));
    for(const section of guide.sections) {
      assert.equal(section.name,null,id);
      assert.equal(section.confirmation_status,'historical_numbering_unverified',id);
      assert.ok(section.aliases.length>0,id);
      assert.ok(section.explanation.en.trim().split(/\s+/).length>=24,id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length>=20,id+':uk');
      assert.ok(section.sources.length>=2,id);
      assert.ok(section.sources.every(key=>/^https:\/\//.test(candidateCornerSources[key])),id);
    }
    assert.equal(guide.review_status,'independent_review_pending');
    assert.equal(hasPublicationReadyCornerGuide(id),false);
  }
});
