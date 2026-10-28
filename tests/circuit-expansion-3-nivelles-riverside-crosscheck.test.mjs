import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const fixture=read("./fixtures/circuit-expansion-3-nivelles-riverside-official-rows.json");
const drafts=read("../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json");
test("Nivelles and Riverside rows are grounded without upgrading context stories",()=>{
 assert.equal(fixture.publication,"blocked");
 assert.equal(fixture.races.length,2);
 for(const race of fixture.races){
  const circuit=drafts.circuits.find(c=>c.circuit_id===race.circuit_id);
  assert.ok(circuit);
  assert.equal(circuit.stories.length,5);
  assert.equal(new Set(race.rows.map(x=>x.story_index)).size,race.rows.length);
  for(const row of race.rows){
   const story=circuit.stories.find(s=>s.story_index===row.story_index);
   assert.ok(story);
   assert.equal(story.year,race.year);
   assert.ok(story.source_urls.includes(race.source_url));
   assert.ok(Number.isInteger(row.laps));
   assert.ok(row.position>=1&&row.position<=20);
   assert.equal(story.publication,"blocked");
   assert.equal(story.independent_approval,false);
  }
  for(const i of race.context_only_story_indices??[])assert.ok(!race.rows.some(r=>r.story_index===i));
 }
 assert.deepEqual(fixture.races[1].context_only_story_indices,[3,4,5]);
});
