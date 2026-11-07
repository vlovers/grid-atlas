import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const base = "../docs/editorial/circuit-experience-v3/";
const files = [
  "EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json",
  "EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json",
];
const anchors = {
  "mosport": ["alternator", "dome-shaped visor", "fifth", "second time", "outside the pit wall"],
  "mont-tremblant": ["lap 12", "pit signals", "tenth", "engine mounts", "lap 65"],
  "monsanto": ["2:02.89", "1955", "qualifying", "DBR4", "Gregory"],
  "jarama": ["lap 14", "0.220", "not a pass caused by a backmarker", "two successive overtakes", "lap 65"],
};
test("20 short EN/UK research scenes retain period-specific evidence and fail-closed gates", () => {
  const seen = new Set();
  let count = 0;
  for (const file of files) {
    const data = JSON.parse(readFileSync(new URL(base + file, import.meta.url), "utf8"));
    assert.equal(data.publication, "blocked");
    for (const circuit of data.circuits) {
      if (!(circuit.circuit_id in anchors)) continue;
      assert.ok(!seen.has(circuit.circuit_id));
      seen.add(circuit.circuit_id);
      assert.deepEqual(circuit.stories.map(s => s.story_index), [1,2,3,4,5]);
      for (const [i, scene] of circuit.stories.entries()) {
        count++;
        assert.ok(scene.narrative.en.includes(anchors[circuit.circuit_id][i]), circuit.circuit_id + " " + i);
        assert.ok(scene.narrative.en.trim().split(/\s+/).length >= 80);
        assert.ok(scene.narrative.uk.trim().split(/\s+/).length >= 65);
        assert.equal(scene.publication, "blocked");
        assert.equal(scene.independent_approval, false);
        assert.ok(scene.historical_sources.some(url => url.includes("motorsportmagazine.com")));
        assert.ok(scene.historical_sources.length >= 2);
      }
    }
  }
  assert.deepEqual([...seen].sort(), Object.keys(anchors).sort());
  assert.equal(count, 20);
});
