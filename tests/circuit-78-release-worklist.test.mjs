import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>JSON.parse(readFileSync(path,'utf8'));
const coverage=load('docs/editorial/circuit-experience-v3/F1DB_78_CONTENT_COVERAGE_20261027.json');
const queue=load('docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json');
test('all 78 circuits have exactly one publication-blocked editorial entry',()=>{
 assert.equal(queue.summary.total,78);
 assert.equal(queue.circuits.length,coverage.circuits.length);
 assert.equal(new Set(queue.circuits.map(x=>x.circuit_id)).size,78);
 assert.deepEqual(queue.circuits.map(x=>x.circuit_id),coverage.circuits.map(x=>x.circuit_id));
 for(let i=0;i<queue.circuits.length;i++){
  const row=queue.circuits[i],base=coverage.circuits[i];
  assert.equal(row.short_content_source,base.short_bilingual_content_source);
  assert.equal(row.five_story_research_batch,base.five_story_research_batch);
  assert.equal(row.publication,'blocked');
  for(const key of ['independent_claim_check','historical_layout_check','turn_names_and_numbers_check','photo_rights_check','bilingual_line_edit'])assert.equal(row[key],'pending');
 }
 assert.equal(queue.summary.publication_ready,0);
 assert.equal(queue.summary.fully_editorially_approved,0);
});
test('33 remaining circuits are batched once into three 11-circuit expansions',()=>{
 const missing=coverage.circuits.filter(x=>x.five_story_research_batch===null).map(x=>x.circuit_id).sort();
 const batches=queue.batches.flatMap(x=>x.circuit_ids).sort();
 assert.deepEqual(batches,missing);
 assert.equal(new Set(batches).size,33);
 assert.equal(queue.batches.length,3);
 assert.ok(queue.batches.every(x=>x.circuit_ids.length===11&&x.acceptance.includes('provenance')));
 assert.equal(queue.summary.five_story_dossier_drafts,45);
 assert.equal(queue.summary.requires_five_story_expansion,33);
 for(const row of queue.circuits){if(row.five_story_research_batch===null)assert.ok(batches.includes(row.circuit_id)&&row.expansion_batch);else assert.equal(row.expansion_batch,null);}
});
