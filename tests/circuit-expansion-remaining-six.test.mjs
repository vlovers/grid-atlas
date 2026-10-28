import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const relative = "../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json";
const data = JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const expected = ["ain-diab", "anderstorp", "bremgarten", "buenos-aires", "bugatti", "clermont-ferrand"];
test("six historical circuits each have five separate bilingual nonpublished source-backed drafts", () => {
  assert.equal(data.publication, "blocked");
  assert.deepEqual(data.circuits.map((x) => x.circuit_id), expected);
  for (const { stories } of data.circuits) {
    assert.equal(stories.length, 5);
    assert.equal(new Set(stories.map((x) => x.title.en)).size, 5);
    for (const [i, story] of stories.entries()) {
      assert.equal(story.story_index, i + 1);
      assert.ok(Number.isInteger(story.year));
      for (const lang of ["uk", "en"]) {
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
