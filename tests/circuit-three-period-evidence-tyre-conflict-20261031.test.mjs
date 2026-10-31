import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const selected=[
  [read('EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json'),'aida'],
  [read('EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json'),'east-london'],
  [read('EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json'),'sebring']
];
test('15 period-evidence scenes remain bilingual, specific, sourced and unpublished',()=>{
  let n=0;
  for(const [doc,id] of selected){
    assert.equal(doc.publication,'blocked');
    const circuit=doc.circuits.find(c=>c.circuit_id===id);
    assert.ok(circuit,id);
    assert.deepEqual(circuit.stories.map(s=>s.story_index),[1,2,3,4,5]);
    for(const s of circuit.stories){
      n++;
      assert.ok(s.narrative.en.trim().split(/\s+/).length>=65,id+' EN');
      assert.ok(s.narrative.uk.trim().split(/\s+/).length>=55,id+' UK');
      assert.ok(s.historical_sources.length>=2,id+' historical evidence');
      assert.equal(s.publication,'blocked');
      assert.equal(s.independent_approval,false);
      assert.equal(s.historical_review_status,'pending_independent_claim_review');
    }
  }
  assert.equal(n,15);
});
test('Aida 1995 does not silently choose a disputed count of fresh tyres',()=>{
  const aida=selected[0][0].circuits.find(c=>c.circuit_id==='aida');
  for(const s of aida.stories.slice(3)){
    assert.match(s.narrative.en,/Grandprix.com/);
    assert.match(s.narrative.en,/Autosport/);
    assert.match(s.narrative.uk,/Autosport/);
    assert.match(s.historical_source_locator,/Exact tyre count disputed/);
    assert.ok(s.historical_sources.some(u=>u.includes('autosport.com')));
  }
  assert.doesNotMatch(aida.stories[4].narrative.en,/Schumacher had saved four new tyre sets/);
});
test('East London Clark mechanical explanation is not repeated verbatim',()=>{
  const east=selected[1][0].circuits.find(c=>c.circuit_id==='east-london');
  const scene=east.stories[1];
  assert.equal((scene.narrative.en.match(/missing locking washer/g)||[]).length,1);
  assert.match(scene.narrative.en,/two-inch bolt/);
  assert.match(scene.narrative.uk,/дводюймовий болт/);
});
