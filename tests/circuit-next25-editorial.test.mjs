import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next25-research-leads.json','utf8'));
test('25 next circuit candidates keep bilingual leads out of public publication',()=>{
 assert.equal(data.status,'research_only');
 assert.equal(data.publication,'blocked');
 assert.equal(data.circuits.length,25);
 assert.equal(new Set(data.circuits.map(c=>c.candidate_slug)).size,25);
 const earlier=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json','utf8'));
 const old=new Set(earlier.circuits.map(c=>c.circuit_id).concat(['monaco','spa-francorchamps']));
 for(const circuit of data.circuits){
  assert.ok(!old.has(circuit.candidate_slug),circuit.candidate_slug);
  assert.equal(circuit.canonical_f1db_id,null);
  assert.equal(circuit.configuration_id,null);
  assert.equal(circuit.publication,'unpublished');
  assert.equal(circuit.story_leads.length,5);
  assert.equal(circuit.story_leads.filter(s=>s.status==='unverified_historical_narrative'||s.status==='official_f1_source_checked_human_review_pending').length,1);
  assert.equal(circuit.story_leads.filter(s=>s.status==='research_question_not_historical_article').length,4);
  for(const story of circuit.story_leads){
    assert.ok(story.sources.every(s=>s.startsWith('https://www.formula1.com/')));
    for(const locale of ['en','uk']){
      assert.ok(story.title[locale].trim().length>=6);
      assert.ok(story.editorial_direction[locale].trim().length>=30);
      assert.ok(circuit.editorial_intro[locale].trim().length>=45);
    }
  }
 }
});
