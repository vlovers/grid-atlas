import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dir = "../docs/editorial/circuit-experience-v3/";
const files = ["EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json", "EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json"];
const expected = ["dijon", "east-london", "jacarepagua", "jarama", "jerez", "madring", "monaco", "monsanto", "mont-tremblant", "montjuic", "mosport"];
test("expansion-2 has eleven distinct five-story bilingual dossiers, all blocked from publication", () => {
  const data = files.map((name) => JSON.parse(readFileSync(new URL(dir + name, import.meta.url), "utf8")));
  assert.ok(data.every((file) => file.publication === "blocked"));
  const circuits = data.flatMap((file) => file.circuits);
  assert.deepEqual(circuits.map((c) => c.circuit_id).sort(), expected);
  for (const circuit of circuits) {
    assert.equal(circuit.stories.length, 5);
    assert.equal(new Set(circuit.stories.map((story) => story.title.en)).size, 5);
    for (const [idx, story] of circuit.stories.entries()) {
      assert.equal(story.story_index, idx + 1);
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
