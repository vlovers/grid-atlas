import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateCornerGuides, candidateCircuitNarratives } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { cornerGuideFor, numberedCorners } from '../apps/web/src/components/editorial/circuit-corner-model.ts';
import { isCircuitEditionApproved, circuitEditionDigest } from '../apps/web/src/components/editorial/circuit-release.ts';
import { renderCircuitReview, startCircuitReview } from '../scripts/preview-circuit-v3.mjs';

test('numbered turns are complete and never confused with distinct named sections', () => {
  assert.equal(candidateCornerGuides.length,4);
  for (const guide of candidateCornerGuides) {
    const turns = numberedCorners(guide);
    assert.deepEqual(turns.map(turn => turn.number),Array.from({length:guide.numbered_turns},(_,index)=>index+1));
    assert.ok(turns.every(turn => turn.layout_id === guide.layout_id && turn.sources.length >= 2));
  }
  const monaco = candidateCornerGuides.find(guide=>guide.circuit_id==='monaco');
  const turns = numberedCorners(monaco);
  assert.equal(turns.length,19);
  assert.equal(turns.find(turn=>turn.number===17).name,null);
  assert.equal(turns[9].section_id,turns[10].section_id);
  assert.equal(turns[12].section_id,turns[15].section_id);
});

test('pending research cannot appear through matching layouts or a fabricated runtime flag', () => {
  process.env.GRID_ATLAS_CIRCUIT_PREVIEW='true';
  try {
    for(const guide of candidateCornerGuides) {
      assert.equal(isCircuitEditionApproved(guide.circuit_id),false);
      assert.equal(cornerGuideFor(guide.circuit_id,[guide.layout_id]),null);
      assert.equal(cornerGuideFor(guide.circuit_id,['monaco-1']),null);
      assert.match(circuitEditionDigest(guide.circuit_id),/^[a-f0-9]{64}$/);
    }
  } finally { delete process.env.GRID_ATLAS_CIRCUIT_PREVIEW; }
});

test('five circuit collections have at least five genuine sourced research stories, with no 2026 retrospective', () => {
  assert.equal(candidateCircuitNarratives.length,5);
  for(const circuit of candidateCircuitNarratives) {
    assert.ok(circuit.moments.length>=5);
    assert.equal(new Set(circuit.moments.map(moment=>moment.id)).size,circuit.moments.length);
    for(const moment of circuit.moments) {
      assert.ok(moment.year<2026);
      assert.ok(moment.title.en && moment.title.uk && moment.text.en && moment.text.uk);
      assert.match(moment.source,/^https:\/\//);
      assert.ok(moment.locator && moment.criterion);
      assert.equal(moment.review_status,'independent_review_pending');
    }
  }
});

test('private review uses existing opt-in transport, shows noindex and names all 19 Monaco numbers', async () => {
  assert.throws(()=>startCircuitReview({port:0}),/acknowledge/);
  const html=renderCircuitReview('uk','/review/test');
  assert.match(html,/НЕОПУБЛІКОВАНА ЧЕРНЕТКА/);
  assert.match(html,/noindex,nofollow,noarchive/);
  assert.match(html,/T19/);
  assert.match(html,/Без окремої назви/);
  assert.doesNotMatch(html,/stroke-width:8!important/);
});
