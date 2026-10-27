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
  assert.ok(circuit.story_leads.filter(s=>s.status==='research_question_not_historical_article').length<=4);
  assert.ok(circuit.story_leads.filter(s=>s.status==='source_checked_research_draft').every(s=>s.narrative?.en.length>120&&s.narrative?.uk.length>120&&s.sources.length>0));
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

test('all 25 event anchors carry exact-year Formula 1 sources but remain blocked',()=>{
 const audit=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT25_PUBLICATION_AUDIT.json','utf8'));
 assert.equal(audit.publication,'blocked');
 assert.equal(audit.official_f1_result_anchors_with_source,25);
 assert.equal(audit.publication_ready_circuits,0);
 assert.equal(audit.fully_cited_race_narratives,0);
 for(const circuit of data.circuits){
  const anchor=circuit.story_leads[0];
  assert.equal(anchor.status,'official_f1_source_checked_human_review_pending');
  assert.ok(anchor.sources.length>=1,circuit.candidate_slug);
  assert.ok(anchor.sources.some(url=>url.includes('/results/'+anchor.year+'/')),circuit.candidate_slug);
  assert.equal(circuit.publication,'unpublished');
 }
 const hatch=data.circuits.find(c=>c.candidate_slug==='brands-hatch').story_leads[0];
 assert.match(hatch.narrative.en,/disqualified/);
 assert.match(hatch.narrative.en,/Niki Lauda/);
});
