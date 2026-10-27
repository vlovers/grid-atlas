import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const file = new URL("../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const expected = ["nivelles","pedralbes","pescara","porto","reims","riverside","rouen","sebring","spa-francorchamps","zeltweg","zolder"];
test("third expansion provides 55 unpublished bilingual story drafts for final 11 circuits", () => {
  assert.equal(data.publication, "blocked");
  assert.deepEqual(data.circuits.map(c => c.circuit_id), expected);
  assert.equal(data.circuits.reduce((sum,c)=>sum+c.stories.length,0),55);
  for (const circuit of data.circuits) {
    assert.equal(circuit.stories.length,5);
    assert.equal(new Set(circuit.stories.map(s=>s.title.en)).size,5);
    circuit.stories.forEach((s,i)=>{
      assert.equal(s.story_index,i+1);
      assert.ok(Number.isInteger(s.year));
      for (const lang of ["en","uk"]) {
        assert.ok(s.title[lang].length > 12);
        assert.ok(s.narrative[lang].length > 75);
      }
      assert.ok(s.source_urls.length > 0);
      assert.ok(s.source_urls.every(url => url.startsWith("https://www.formula1.com/")));
      assert.equal(s.independent_approval,false);
      assert.equal(s.publication,"blocked");
    });
  }
});
