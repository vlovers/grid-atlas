import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const data=JSON.parse(readFileSync(new URL("../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json",import.meta.url),"utf8"));
test("Riverside stories cite actual 1960 race result as well as explanatory history",()=>{
 const circuit=data.circuits.find(c=>c.circuit_id==="riverside");
 assert.ok(circuit);
 assert.equal(circuit.stories.length,5);
 for(const story of circuit.stories){
  assert.equal(story.year,1960);
  assert.ok(story.source_urls.includes("https://www.formula1.com/en/results/1960/races/187/united-states/race-result"));
  assert.ok(story.source_urls.some(url=>url.includes("/en/latest/article/")));
  assert.equal(story.publication,"blocked");
  assert.equal(story.independent_approval,false);
 }
});
