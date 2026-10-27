import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const file = new URL("../docs/editorial/circuit-experience-v3/EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json", import.meta.url);
const drafts = JSON.parse(readFileSync(file, "utf8"));

test("Aida and Dallas expansion has exactly five distinct sourced bilingual drafts each", () => {
  assert.equal(drafts.publication, "blocked");
  assert.deepEqual(drafts.circuits.map((c) => c.circuit_id), ["aida", "dallas"]);
  for (const circuit of drafts.circuits) {
    assert.equal(circuit.stories.length, 5);
    assert.deepEqual(circuit.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(circuit.stories.map((s) => s.title.en)).size, 5);
    for (const story of circuit.stories) {
      assert.ok(Number.isInteger(story.year));
      for (const locale of ["en", "uk"]) {
        assert.ok(story.title[locale].length > 12);
        assert.ok(story.narrative[locale].length > 100);
      }
      assert.ok(story.source_urls.length >= 1);
      assert.ok(story.source_urls.every((url) => url.startsWith("https://www.formula1.com/")));
      assert.equal(story.independent_approval, false);
      assert.equal(story.publication, "blocked");
    }
  }
});
