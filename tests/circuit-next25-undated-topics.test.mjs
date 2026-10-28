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

test('all 23 originally undated bilingual leads have explicit review outcomes',()=>{
 const original=[['miami',3],['watkins-glen',2],['watkins-glen',3],['kyalami',3],['paul-ricard',2],['paul-ricard',3],['magny-cours',2],['magny-cours',3],['estoril',4],['portimao',2],['mugello',2],['donington-park',4],['valencia-street',4],['korea-international',1],['korea-international',3],['buddh',2],['buddh',4],['sochi',2],['phoenix-street',2],['phoenix-street',4],['detroit-street',2],['detroit-street',4],['long-beach',4]];
 const keys=new Set(original.map(([slug,i])=>slug+':'+i));
 assert.equal(keys.size,23);
 let dated=0,undated=0;
 for(const [slug,i] of original){
  const circuit=content.circuits.find(c=>c.candidate_slug===slug);
  assert.ok(circuit,slug);
  const story=circuit.story_leads[i];
  assert.ok(story.narrative.en.length>120,slug+':'+i+':en');
  assert.ok(story.narrative.uk.length>120,slug+':'+i+':uk');
  assert.ok(story.editorial_direction.en.length>30);
  assert.ok(story.editorial_direction.uk.length>30);
  assert.equal(circuit.publication,'unpublished');
  if(story.year===null){
   undated++;
   assert.ok(review.records.some(x=>x.circuit_id===slug&&x.story_index===i),slug+':'+i);
  }else{
   dated++;
   assert.ok(Number.isInteger(story.year)&&story.year>=1950&&story.year<=2026);
  }
 }
 assert.equal(dated,9);
 assert.equal(undated,14);
});
