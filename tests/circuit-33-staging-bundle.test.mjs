import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const read = file => JSON.parse(readFileSync(new URL(file,base),'utf8'));
const bundle=read('CIRCUIT_33_STAGING_BUNDLE.json');
const ledger=read('CIRCUIT_33_CANONICAL_STORY_INDEX.json');
const coverage=read('F1DB_78_CONTENT_COVERAGE_20261027.json');

test('staging bundle covers precisely 33 circuits and indexes 76 historical event drafts',()=>{
 const ids=coverage.circuits.filter(x=>!x.five_story_research_batch).map(x=>x.circuit_id).sort();
 assert.equal(bundle.kind,'editorial_staging_only');
 assert.deepEqual(bundle.circuits.map(c=>c.circuit_id),ids);
 assert.equal(bundle.summary.circuits,33);
 assert.equal(bundle.summary.dated_events,76);
 assert.equal(bundle.summary.second_angles,10);
 assert.equal(bundle.summary.approved_articles,0);
 for(const circuit of bundle.circuits){
  const events=ledger.entries.filter(x=>x.circuit_id===circuit.circuit_id&&x.event_year!==null);
  assert.deepEqual(circuit.events.map(x=>x.year),events.map(x=>x.event_year));
  assert.equal(circuit.editorial_gate.publish,false);
  assert.equal(circuit.editorial_gate.fact_check,false);
  for(const event of circuit.events){
   assert.equal(event.publication_allowed,false);
   assert.equal(event.review_status,'unreviewed');
   assert.ok(event.draft_path.startsWith('docs/editorial/'));
  }
  for(const angle of circuit.secondary_angles){
   assert.equal(angle.relation,'same_event');
   assert.equal(angle.publication_allowed,false);
   for(const locale of ['en','uk']){
    assert.ok(angle.title[locale].length>10);
    assert.ok(angle.body[locale].length>250);
   }
  }
 }
});
