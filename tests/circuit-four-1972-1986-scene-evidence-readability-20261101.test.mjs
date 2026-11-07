import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../docs/editorial/circuit-experience-v3/", import.meta.url);
const targets = [
  ["EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json", ["anderstorp", "clermont-ferrand"]],
  ["EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json", ["jarama", "jerez"]],
];

test("20 period-sourced scenes retain bilingual reading copy and distinct evidence boundaries", () => {
  const seen = new Set();
  for (const [filename, circuitIds] of targets) {
    const doc = JSON.parse(readFileSync(new URL(filename, root), "utf8"));
    assert.equal(doc.publication, "blocked");
    for (const id of circuitIds) {
      const circuit = doc.circuits.find(item => item.circuit_id === id);
      assert.ok(circuit, id);
      assert.deepEqual(circuit.stories.map(scene => scene.story_index), [1, 2, 3, 4, 5]);
      const locators = new Set();
      for (const scene of circuit.stories) {
        seen.add(id + "/" + scene.story_index);
        assert.ok(scene.narrative.en.trim().split(/\s+/).length >= 65, id + "/EN");
        assert.ok(scene.narrative.uk.trim().split(/\s+/).length >= 55, id + "/UK");
        assert.ok(scene.historical_source_locator.includes("Motor Sport"), id + "/period source");
        assert.ok(scene.historical_source_locator.includes("Grandprix.com"), id + "/independent narrative");
        assert.ok(/(?:F1|classification)/.test(scene.historical_source_locator), id + "/classification boundary");
        locators.add(scene.historical_source_locator);
        assert.ok(scene.historical_sources.some(url => url.includes("motorsportmagazine.com")));
        assert.ok(scene.historical_sources.some(url => url.includes("grandprix.com")));
        assert.equal(scene.historical_review_status, "pending_independent_claim_review");
        assert.equal(scene.independent_approval, false);
        assert.equal(scene.publication, "blocked");
      }
      assert.equal(locators.size, 5, id + "/specific evidence notes");
    }
  }
  assert.equal(seen.size, 20);
});
