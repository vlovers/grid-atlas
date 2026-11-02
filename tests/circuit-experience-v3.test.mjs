import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateCornerGuides, candidateCircuitNarratives } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { cornerGuideFor, numberedCorners } from '../apps/web/src/components/editorial/circuit-corner-model.ts';
import { isCircuitEditionApproved, circuitEditionDigest } from '../apps/web/src/components/editorial/circuit-release.ts';
import { renderCircuitReview, startCircuitReview } from '../scripts/preview-circuit-v3.mjs';

test('numbered turns are complete and never confused with distinct named sections', () => {
  assert.ok(candidateCornerGuides.length >= 16, 'do not regress already sourced circuit guides');
  assert.equal(new Set(candidateCornerGuides.map(guide => guide.circuit_id)).size, candidateCornerGuides.length, 'no duplicate circuit guides');
  for (const guide of candidateCornerGuides) {
    const turns = numberedCorners(guide);
    assert.deepEqual(turns.map(turn => turn.number),Array.from({length:guide.numbered_turns},(_,index)=>index+1));
    assert.ok(turns.every(turn => turn.layout_id === guide.layout_id && turn.sources.length >= 2));
  }
  for (const id of ['austin','bahrain','interlagos','monaco','monza','silverstone','spa-francorchamps','suzuka']) {
    assert.ok(candidateCornerGuides.some(guide => guide.circuit_id === id), id + ': legacy guide missing');
  }
  const monaco = candidateCornerGuides.find(guide=>guide.circuit_id==='monaco');
  const turns = numberedCorners(monaco);
  assert.equal(turns.length,19);
  assert.equal(turns.find(turn=>turn.number===17).name,null);
  // Shared complex names must remain shared, but each bend now has its own focus target and copy.
  assert.equal(turns[9].name, turns[10].name);
  assert.equal(turns[12].name, turns[15].name);
  assert.notEqual(turns[9].section_id, turns[10].section_id);
  assert.notEqual(turns[12].section_id, turns[15].section_id);
  assert.equal(new Set(turns.map(turn => turn.section_id)).size, 19);
  const spa = candidateCornerGuides.find(guide => guide.circuit_id === 'spa-francorchamps');
  assert.equal(new Set(numberedCorners(spa).map(turn => turn.section_id)).size, 19);
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

test('original five collections keep five sourced stories while new historical guides add two or more', () => {
  const original = new Set(['monaco','spa-francorchamps','monza','suzuka','silverstone']);
  assert.ok(candidateCircuitNarratives.length>=11);
  for(const circuit of candidateCircuitNarratives) {
    assert.ok(circuit.moments.length >= (original.has(circuit.circuit_id) ? 5 : 2), circuit.circuit_id);
    assert.equal(new Set(circuit.moments.map(moment=>moment.id)).size,circuit.moments.length);
    for(const moment of circuit.moments) {
      assert.ok(Number.isInteger(moment.year) && moment.year >= 1900 && moment.year <= 2026, `${circuit.circuit_id}: invalid event year ${moment.year}`);
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


test('seven missing historic circuits surface bilingual unnumbered route studies without false apex claims', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const component = readFileSync(new URL('../apps/web/src/components/editorial/circuit-corner-guide.tsx', import.meta.url), 'utf8');
  const pending = ['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring'];
  assert.doesNotMatch(component, /historicRoutes/);
  assert.doesNotMatch(component, /const historicRoute = historicRoutes\.circuits\.find/);
  assert.match(component, /historical route sections, not numbered corners/i);
  assert.match(component, /Historical source \(not number verification\)/);
  for (const id of pending) {
    const circuit = research.circuits.find(c => c.circuit_id === id);
    assert.ok(circuit, id + ': missing historical route');
    assert.ok(!candidateCornerGuides.some(g => g.circuit_id === id), id + ': a numbered guide must not be inferred from unnumbered research');
    assert.equal(circuit.independent_numbering_verified, false);
    assert.ok(circuit.sections.length >= 2);
    for (const section of circuit.sections) {
      assert.ok(section.label.en.trim() && section.label.uk.trim(), id + ': bilingual title');
      assert.ok(section.description.en.trim() && section.description.uk.trim(), id + ': bilingual copy');
      assert.equal(section.turn_numbers, null, id + ': no fabricated turn mapping');
      assert.ok(section.source_urls.length >= 1 && section.source_urls.every(url => /^https:\/\//.test(url)));
    }
    assert.equal(isCircuitEditionApproved(id), false, id + ': no publication approval');
  }
});
