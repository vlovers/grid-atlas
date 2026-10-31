import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const files = [
  "../docs/editorial/circuit-experience-v3/EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json",
  "../docs/editorial/circuit-experience-v3/EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json",
  "../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json",
  "../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json"
];
const expected = {
  "dallas": [
    "The 50-lap Can-Am race on",
    "Rosberg had started only eighth.",
    "Mansell's 1:37.041 qualifying lap had",
    "Prost's second contact with a",
    "Only Arnoux finished on the"
  ],
  "caesars-palace": [
    "Reutemann eventually finished eighth after",
    "Prost's stop for four fresh",
    "Alboreto had qualified third behind",
    "Tambay withdrew because of recurring",
    "For Cheever this was also"
  ],
  "bremgarten": [
    "Fangio set the race's fastest",
    "Hawthorn had briefly passed González",
    "Kling had worked his way",
    "Wharton's sixth-placed Maserati was a",
    "The contemporary report specifically describes"
  ],
  "bugatti": [
    "The 4.422-kilometre Bugatti loop used",
    "Hulme still had to race",
    "During practice BRM reassigned the",
    "Clark moved to the front",
    "Irwin's H16 BRM began leaking"
  ],
  "riverside": [
    "Brabham led the first four",
    "Dan Gurney had also chased",
    "Moss's 1:54.4 pole lap was",
    "The course also crossed an",
    "Local entrant Jim Hall made"
  ]
};

test('25 weak-dossier scenes have specific EN/UK chronology and remain blocked', () => {
  let checked = 0;
  const found = new Set();
  for (const path of files) {
    const source = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
    assert.equal(source.publication, 'blocked');
    for (const circuit of source.circuits) {
      const anchors = expected[circuit.circuit_id];
      if (!anchors) continue;
      found.add(circuit.circuit_id);
      assert.deepEqual(circuit.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
      for (const [index, scene] of circuit.stories.entries()) {
        checked++;
        assert.ok(scene.narrative.en.includes(anchors[index]), circuit.circuit_id + '/' + index);
        assert.ok(scene.narrative.en.split(/\s+/).length >= 65, circuit.circuit_id + '/EN');
        assert.ok(scene.narrative.uk.split(/\s+/).length >= 55, circuit.circuit_id + '/UK');
        assert.equal(scene.independent_approval, false);
        assert.equal(scene.publication, 'blocked');
        assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
        assert.ok(scene.source_urls.some(url => url.includes('formula1.com/en/results/')));
        assert.ok(scene.historical_sources.some(url => url.includes('motorsportmagazine.com')));
        assert.ok(scene.historical_sources.some(url => url.includes('grandprix.com/races/')));
      }
    }
  }
  assert.deepEqual([...found].sort(), Object.keys(expected).sort());
  assert.equal(checked, 25);
});
