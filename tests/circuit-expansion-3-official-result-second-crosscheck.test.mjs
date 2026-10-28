import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read = name => JSON.parse(readFileSync(new URL(name,import.meta.url),"utf8"));
const source=read("./fixtures/circuit-expansion-3-official-race-rows-second-batch.json");
const review=read("../docs/editorial/circuit-experience-v3/EXPANSION_3_CLASSIFICATION_CHECKS_SECOND_BATCH_20261027.json");
test("second review set agrees with independently pinned historic F1 results",()=>{
 assert.equal(source.races.length,3);
 for(const race of source.races){
  const actual=review.circuits.find(c=>c.circuit_id===race.circuit_id);
  assert.ok(actual,race.circuit_id);
  assert.equal(actual.race_year,race.year);
  assert.equal(actual.source_url,race.source_url);
  assert.deepEqual(actual.story_checks.map(s=>[s.driver,s.classification_position,s.laps,s.winning_gap_seconds]),race.rows,race.circuit_id);
  for(const story of actual.story_checks){
   assert.equal(story.full_story_approved,false);
   assert.equal(story.publication,"blocked");
  }
 }
});
