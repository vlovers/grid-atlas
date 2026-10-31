import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = "../docs/editorial/circuit-experience-v3/";
const files = [
  "EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json",
  "EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json",
  "EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json",
];
const expected = {
  aida: { years: [1994, 1994, 1994, 1995, 1995], en: ["Häkkinen", "Hill", "Brundle", "Coulthard", "Williams"], uk: ["Гаккінен", "Гілл", "Баррікелло", "Шумахер", "Култгард"] },
  dallas: { years: [1984, 1984, 1984, 1984, 1984], en: ["warm-up", "lap 49", "sixth", "McLaren", "Ghinzani"], uk: ["розминку", "49-му", "Шосте", "McLaren", "Гіндзані"] },
  "caesars-palace": { years: [1981, 1981, 1982, 1982, 1982], en: ["lap 17", "Giacomelli", "Renaults", "Ferrari", "Cheever"], uk: ["17-му", "Джакомеллі", "Renault", "Ferrari", "Чівер"] },
  riverside: { years: [1960, 1960, 1960, 1960, 1960], en: ["Brabham", "Bonnier", "Colotti", "3.275-mile", "Watkins Glen"], uk: ["Бребем", "Боньє", "Colotti", "3,275-мильною", "Watkins Glen"] },
};

test("20 historical scenes retain bilingual chronology, two period publishers and fail-closed publication", () => {
  const found = new Set();
  let scenes = 0;
  for (const file of files) {
    const doc = JSON.parse(readFileSync(new URL(root + file, import.meta.url), "utf8"));
    assert.equal(doc.publication, "blocked");
    for (const circuit of doc.circuits) {
      const e = expected[circuit.circuit_id];
      if (!e) continue;
      assert.ok(!found.has(circuit.circuit_id), "duplicate circuit");
      found.add(circuit.circuit_id);
      assert.deepEqual(circuit.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
      assert.deepEqual(circuit.stories.map(s => s.year), e.years);
      for (const [index, story] of circuit.stories.entries()) {
        scenes++;
        for (const locale of ["en", "uk"]) {
          assert.ok(story.narrative[locale].length >= 200, circuit.circuit_id + " " + locale + " " + index);
          assert.ok(story.narrative[locale].includes(e[locale][index]), circuit.circuit_id + " anchor " + locale + " " + index);
        }
        assert.equal(story.independent_approval, false);
        assert.equal(story.publication, "blocked");
        assert.equal(story.historical_review_status, "pending_independent_claim_review");
        assert.match(story.historical_source_locator, /classification only.*independent review pending/i);
        assert.ok(story.source_urls.every(u => /^https:\/\/www\.formula1\.com\//.test(u)));
        assert.ok(story.historical_sources.some(u => u.includes("motorsportmagazine.com/")));
        assert.ok(story.historical_sources.some(u => u.includes("grandprix.com/")));
        assert.ok(story.historical_sources.every(u => !story.source_urls.includes(u)));
      }
    }
  }
  assert.equal(scenes, 20);
  assert.deepEqual([...found].sort(), Object.keys(expected).sort());
});
