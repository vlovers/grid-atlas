import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = "../docs/editorial/circuit-experience-v3/";
const second = JSON.parse(readFileSync(new URL(root+"EXPANSION_3_CLASSIFICATION_CHECKS_SECOND_BATCH_20261027.json",import.meta.url),"utf8"));
const drafts = JSON.parse(readFileSync(new URL(root+"EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json",import.meta.url),"utf8"));
test("second source-check batch maps 15 checked result rows to unpublished stories", () => {
 assert.equal(second.publication,"blocked");
 assert.deepEqual(second.circuits.map(c=>c.circuit_id),["pescara","zeltweg","zolder"]);
 for(const entry of second.circuits){
  assert.equal(entry.story_checks.length,5);
  assert.ok(entry.source_url.includes("/results/"+entry.race_year+"/"));
  const circuit = drafts.circuits.find(c=>c.circuit_id===entry.circuit_id);
  assert.ok(circuit);
  for(const row of entry.story_checks){
   const story = circuit.stories.find(s=>s.story_index===row.story_index);
   assert.ok(story);
   assert.equal(story.year,entry.race_year);
   assert.ok(row.driver.length>2);
   assert.ok(Number.isInteger(row.laps));
   assert.equal(row.full_story_approved,false);
   assert.equal(row.publication,"blocked");
   assert.equal(story.publication,"blocked");
   assert.equal(story.independent_approval,false);
  }
 }
});
