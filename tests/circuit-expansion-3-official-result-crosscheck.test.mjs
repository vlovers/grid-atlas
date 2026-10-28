import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const official = read("./fixtures/circuit-expansion-3-official-race-rows.json");
const reviewed = read("../docs/editorial/circuit-experience-v3/EXPANSION_3_CLASSIFICATION_CHECKS_20261027.json");

function comparable(row) {
  return {
    story_index: row.story_index,
    driver: row.claims.driver,
    position: row.claims.position,
    laps: row.claims.laps,
    gap: row.claims.finish_gap_seconds
  };
}
test("reviewed classification facts match independently transcribed F1 race rows", () => {
  assert.equal(official.races.length, 3);
  for (const race of official.races) {
    const matched = reviewed.circuits.find((c) => c.circuit_id === race.circuit_id);
    assert.ok(matched, race.circuit_id);
    assert.equal(matched.year, race.year);
    assert.equal(matched.source_url, race.url);
    assert.deepEqual(matched.story_checks.map(comparable), race.rows, race.circuit_id);
    for (const check of matched.story_checks) {
      assert.equal(check.publication, "blocked");
      assert.notEqual(check.narrative_evidence, "independently_approved");
    }
  }
});
