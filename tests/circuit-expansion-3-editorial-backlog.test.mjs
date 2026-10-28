import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const root = "../docs/editorial/circuit-experience-v3/";
const manuscript = JSON.parse(readFileSync(new URL(root+"EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json",import.meta.url),"utf8"));
const backlog = JSON.parse(readFileSync(new URL(root+"EXPANSION_3_EDITORIAL_QUALITY_BACKLOG.json",import.meta.url),"utf8"));
test("short bilingual manuscript records are explicitly tracked and stay blocked",()=>{
 const short=manuscript.circuits.flatMap(c=>c.stories.filter(s=>Math.min(s.narrative.en.length,s.narrative.uk.length)<120).map(s=>c.circuit_id+":"+s.story_index)).sort();
 const tracked=backlog.issues.map(s=>s.circuit_id+":"+s.story_index).sort();
 assert.equal(backlog.count,short.length);
 assert.deepEqual(tracked,short);
 assert.equal(backlog.publication,"blocked");
 for(const c of manuscript.circuits)for(const s of c.stories){
  assert.equal(s.publication,"blocked");
  assert.equal(s.independent_approval,false);
  for(const url of s.source_urls){
   const year=url.match(/\/results\/(\d{4})\//);
   if(year) assert.equal(Number(year[1]),s.year,c.circuit_id+" story "+s.story_index+" has wrong-year URL");
  }
 }
});
