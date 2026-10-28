import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const root="../docs/editorial/circuit-experience-v3/";
const read=(file)=>JSON.parse(readFileSync(new URL(root+file,import.meta.url),"utf8"));
const manuscript=read("EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json");
const claimReview=read("EXPANSION_3_CLASSIFICATION_CHECKS_20261027.json");
test("Reims separates Herrmann fastest-lap story from Fangio/Kling result recap",()=>{
 const stories=manuscript.circuits.find(c=>c.circuit_id==="reims").stories;
 const story=stories.find(s=>s.story_index===3);
 assert.match(story.narrative.en,/Hans Herrmann.*fastest lap/);
 assert.match(story.narrative.uk,/Ганс Геррманн.*найшвидше коло/);
 assert.ok(story.source_urls.some(url=>url.includes("emercedesbenz.com/autos/mercedes-benz/classic/")));
 assert.equal(story.publication,"blocked");
 assert.equal(story.independent_approval,false);
 const evidence=claimReview.circuits.find(c=>c.circuit_id==="reims").story_checks.find(s=>s.story_index===3);
 assert.equal(evidence.classification_evidence,"background_race_row_only");
 assert.equal(evidence.narrative_evidence,"independent_historical_source_required");
});
