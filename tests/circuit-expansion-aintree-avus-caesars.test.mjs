import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const draft = JSON.parse(readFileSync(new URL("../docs/editorial/circuit-experience-v3/EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json", import.meta.url), "utf8"));

test("expansion-1 adds five nonpublished bilingual stories for each of three circuits", () => {
  assert.equal(draft.publication, "blocked");
  assert.deepEqual(draft.circuits.map((c) => c.circuit_id), ["aintree", "avus", "caesars-palace"]);
  for (const circuit of draft.circuits) {
    assert.equal(circuit.stories.length, 5);
    assert.equal(new Set(circuit.stories.map((s) => s.title.en)).size, 5);
    for (const [index, story] of circuit.stories.entries()) {
      assert.equal(story.story_index, index + 1);
      assert.ok(Number.isInteger(story.year));
      for (const lang of ["en", "uk"]) {
        assert.ok(story.title[lang].length > 12);
        assert.ok(story.narrative[lang].length > 100);
      }
      assert.ok(story.source_urls.length > 0);
      assert.ok(story.source_urls.every((url) => url.startsWith("https://www.formula1.com/")));
      assert.equal(story.independent_approval, false);
      assert.equal(story.publication, "blocked");
    }
  }
});
