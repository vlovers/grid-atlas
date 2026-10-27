import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(
  readFileSync('docs/editorial/circuit-experience-v3/next20-f1db-layout-catalog-v1.json', 'utf8'),
);
const manuscripts = JSON.parse(
  readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', 'utf8'),
);

test('105 historical events link to pinned F1DB race and layout identities', () => {
  assert.equal(catalog.source_release, 'v2026.17.0');
  assert.equal(catalog.summary.race_level_verified_events, 105);
  assert.equal(catalog.summary.race_level_unverified_events, 0);
  assert.equal(catalog.summary.race_level_ambiguous_events, 0);
  assert.equal(catalog.summary.race_level_year_hint_mismatches, 0);
  assert.equal(catalog.summary.race_level_disambiguated_events, 2);
  assert.equal(catalog.circuits.length, 20);
  const seenRaceIds = new Set();
  let eventCount = 0;
  let disambiguated = 0;

  for (const circuit of catalog.circuits) {
    const manuscript = manuscripts.circuits.find(
      (item) => item.circuit_id === circuit.editorial_circuit_id,
    );
    assert.ok(manuscript, circuit.editorial_circuit_id);
    assert.equal(circuit.events.length, manuscript.moments.length);
    const layoutIds = new Set(circuit.layouts.map((layout) => layout.id));
    for (const event of circuit.events) {
      eventCount++;
      const label = `${circuit.editorial_circuit_id} ${event.year}`;
      const story = manuscript.moments.find(
        (moment) => moment.year === event.year && moment.title.en === event.title_en,
      );
      assert.ok(story, label);
      assert.ok(story.sources.length > 0, label);
      assert.ok(
        ['pinned_race_yaml_exact', 'pinned_race_yaml_event_disambiguated'].includes(
          event.race_verification_status,
        ),
        label,
      );
      const evidence = event.race_evidence;
      assert.ok(evidence, label);
      assert.match(evidence.f1db_race_id, /^\d+$/, label);
      assert.equal(seenRaceIds.has(evidence.f1db_race_id), false, label);
      seenRaceIds.add(evidence.f1db_race_id);
      assert.match(evidence.race_date, new RegExp(`^${event.year}-\\d{2}-\\d{2}$`), label);
      assert.ok(evidence.grand_prix_id.length > 1, label);
      assert.ok(layoutIds.has(evidence.circuit_layout_id), label);
      assert.ok(
        evidence.source_url.startsWith(
          `https://github.com/f1db/f1db/blob/v2026.17.0/src/data/seasons/${event.year}/races/`,
        ),
        label,
      );
      assert.ok(evidence.source_url.endsWith('/race.yml'), label);
      if (event.layout_id_candidate !== null) {
        assert.equal(event.layout_id_candidate, evidence.circuit_layout_id, label);
      }
      if (event.race_verification_status === 'pinned_race_yaml_event_disambiguated') {
        disambiguated++;
        assert.ok(event.race_candidates.length > 1, label);
        assert.ok(
          event.race_candidates.some((candidate) => candidate.source_url === evidence.source_url),
          label,
        );
        assert.ok(story.sources.includes(event.event_disambiguation.source_url), label);
        assert.ok(event.event_disambiguation.reason.length >= 35, label);
      }
    }
  }
  assert.equal(eventCount, 105);
  assert.equal(disambiguated, 2);
});

test('race-specific provenance does not unlock publication or corner geometry', () => {
  assert.ok(catalog.publication.includes('blocked'));
  assert.ok(manuscripts.publication.includes('blocked'));
  for (const circuit of catalog.circuits) {
    assert.equal(circuit.publication, 'unpublished');
    assert.equal(circuit.corner_numbering_verified, false);
    assert.ok(circuit.layouts.every((layout) => layout.media_rights_status !== 'approved'));
  }
});
