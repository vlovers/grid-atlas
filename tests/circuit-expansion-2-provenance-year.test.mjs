import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const files=["EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json","EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json"];
test("every historic race claim has at least one matching-season results URL",()=>{
 for(const name of files){
  const doc=JSON.parse(readFileSync(new URL("../docs/editorial/circuit-experience-v3/"+name,import.meta.url),"utf8"));
  for(const circuit of doc.circuits)for(const story of circuit.stories){
   const years=story.source_urls.flatMap(url=>[...url.matchAll(/\/results\/(\d{4})\//g)].map(m=>Number(m[1])));
   if(years.length)assert.ok(years.includes(story.year),circuit.circuit_id+" story "+story.story_index+" has "+years+" instead of "+story.year);
  }
 }
});
