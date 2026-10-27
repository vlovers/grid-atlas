import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const root="../docs/editorial/circuit-experience-v3/";
const manuscript=JSON.parse(readFileSync(new URL(root+"EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json",import.meta.url),"utf8"));
const queue=JSON.parse(readFileSync(new URL(root+"EXPANSION_3_CLAIM_LEVEL_RELEASE_QUEUE.json",import.meta.url),"utf8"));
test("claim-level release queue covers every third-batch story without granting approval",()=>{
 const expected=manuscript.circuits.flatMap(c=>c.stories.map(s=>c.circuit_id+":"+s.story_index)).sort();
 const actual=queue.records.map(r=>r.circuit_id+":"+r.story_index).sort();
 assert.equal(new Set(actual).size,55);
 assert.deepEqual(actual,expected);
 assert.equal(queue.publication,"blocked");
 assert.equal(queue.totals.full_narrative_approved,0);
 for(const entry of queue.records){
  const story=manuscript.circuits.find(c=>c.circuit_id===entry.circuit_id).stories.find(s=>s.story_index===entry.story_index);
  assert.equal(entry.year,story.year);
  assert.deepEqual(entry.source_urls,story.source_urls);
  assert.equal(entry.publication,"blocked");
  assert.equal(entry.independent_approval,false);
  assert.equal(entry.historical_context_evidence_status,"requires_independent_event_source");
  assert.equal(entry.uk_en_semantic_consistency,"pending");
  assert.equal(story.publication,"blocked");
 }
});
