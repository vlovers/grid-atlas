import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const root="../docs/editorial/circuit-experience-v3/";
const claims=JSON.parse(readFileSync(new URL(root+"EXPANSION_3_CLASSIFICATION_CHECKS_20261027.json",import.meta.url),"utf8"));
const draft=JSON.parse(readFileSync(new URL(root+"EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json",import.meta.url),"utf8"));
test("classification evidence never upgrades story manuscripts to publication approval",()=>{
 assert.equal(claims.publication,"blocked");
 assert.equal(claims.circuits.length,3);
 for(const entry of claims.circuits){
  const circuit=draft.circuits.find(c=>c.circuit_id===entry.circuit_id);
  assert.ok(circuit);
  assert.equal(entry.story_checks.length,5);
  assert.ok(entry.source_url.includes("/results/"+entry.year+"/"));
  for(const check of entry.story_checks){
   const story=circuit.stories.find(s=>s.story_index===check.story_index);
   assert.ok(story);
   assert.equal(story.year,entry.year);
   assert.equal(story.publication,"blocked");
   assert.equal(story.independent_approval,false);
   assert.equal(check.publication,"blocked");
   assert.ok(["not_independently_approved","independent_historical_source_required"].includes(check.narrative_evidence));
   assert.ok(["checked_against_official_f1","background_race_row_only"].includes(check.classification_evidence));
   if(check.classification_evidence==="background_race_row_only") {
    assert.equal(check.narrative_evidence,"independent_historical_source_required");
    assert.ok(check.evidence_limitation.length>20);
   }
   assert.ok(check.claims.driver);
   assert.ok(Number.isInteger(check.claims.laps));
  }
 }
});
