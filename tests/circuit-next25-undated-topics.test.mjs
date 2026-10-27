import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const content = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next25-research-leads.json','utf8'));
const review = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT25_UNDATED_TOPIC_REVIEW.json','utf8'));
test('all undated stories are inventoried without fabricated event years',()=>{
 const undated=content.circuits.flatMap(c=>c.story_leads.flatMap((s,i)=>s.year===null?[{slug:c.candidate_slug,index:i,title:s.title.en}]:[]));
 assert.equal(review.publication,'blocked');
 assert.equal(review.records.length,undated.length);
 const found=new Set();
 for(const rec of review.records){
  const key=rec.circuit_id+':'+rec.story_index;
  assert.ok(!found.has(key),key);
  found.add(key);
  assert.equal(rec.year,null);
  assert.equal(rec.publication,'blocked');
  assert.equal(rec.independent_approval,false);
  assert.ok(rec.required_action.length>15);
  assert.ok(undated.some(x=>x.slug===rec.circuit_id&&x.index===rec.story_index&&x.title===rec.title_en),key);
 }
 assert.equal(review.summary.total,undated.length);
 assert.equal(review.summary.period_or_transition+review.summary.configuration_topics,undated.length);
});
