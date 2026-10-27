import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => JSON.parse(readFileSync(path,'utf8'));
const batch=read('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json');
const audit=read('docs/editorial/circuit-experience-v3/NEXT20_CLAIM_REVIEW_QUEUE.json');

test('all 105 event review rows match current bilingual manuscript exactly',()=>{
 const expected=batch.circuits.flatMap(c=>c.moments.map((moment,index)=>({
  id:c.circuit_id,index,year:moment.year,title:moment.title.en,urls:moment.sources
 })));
 assert.equal(audit.records.length,expected.length);
 assert.equal(audit.summary.total,expected.length);
 assert.equal(audit.summary.sourced,expected.filter(r=>r.urls.length).length);
 const keys=new Set();
 for(const [index,record] of audit.records.entries()){
  const source=expected[index];
  assert.equal(record.circuit_id,source.id);
  assert.equal(record.moment_index,source.index);
  assert.equal(record.event_year,source.year);
  assert.equal(record.event_title_en,source.title);
  assert.deepEqual(record.source_urls,source.urls);
  const key=record.circuit_id+'/'+record.moment_index;
  assert.ok(!keys.has(key),key);
  keys.add(key);
  assert.equal(record.publication,'blocked');
  assert.equal(typeof record.independent_editorial_approval,'boolean');
  assert.equal(typeof record.media_rights_approval,'boolean');
  assert.ok(['required','reviewed'].includes(record.layout_evidence_review));
  assert.ok(['required','reviewed'].includes(record.claim_evidence_review));
  if(record.publication==='blocked')continue;
  assert.equal(record.independent_editorial_approval,true);
  assert.equal(record.media_rights_approval,true);
 }
});

test('research status cannot be silently relabelled as published',()=>{
 assert.equal(audit.publication,'blocked');
 assert.notEqual(batch.publication,'published');
 assert.ok(audit.records.every(m=>m.publication==='blocked'));
});
