import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path)=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const fixture=read("./fixtures/circuit-expansion-3-official-race-rows-third-batch.json");
const draft=read("../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json");
test("Pedralbes Porto Spa official results preserve distinct finish and retirement statuses",()=>{
 assert.equal(fixture.publication,"blocked");
 assert.equal(fixture.races.length,3);
 for(const race of fixture.races){
  const circuit=draft.circuits.find(c=>c.circuit_id===race.circuit_id);
  assert.ok(circuit,race.circuit_id);
  assert.equal(race.rows.length,5);
  for(const [index,[driver,status,laps,gap]] of race.rows.entries()){
   const story=circuit.stories.find(s=>s.story_index===index+1);
   assert.ok(story);
   assert.equal(story.year,race.year);
   assert.ok(story.source_urls.includes(race.url));
   assert.equal(story.publication,"blocked");
   assert.equal(story.independent_approval,false);
   assert.ok(driver.length>4);
   assert.match(status,/^(?:[1-9]|NC|DQ)$/);
   assert.ok(Number.isInteger(laps));
   assert.ok(gap.length>0);
  }
 }
 assert.equal(fixture.races[1].rows[4][1],"DQ");
 assert.equal(fixture.races[2].rows[4][2],0);
});
