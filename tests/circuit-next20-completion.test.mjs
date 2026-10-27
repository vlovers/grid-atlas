import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(
  readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', 'utf8'),
);
const permittedReviews = new Set([
  'source_checked_research_draft',
  'official_classification_checked_interpretation_pending',
  'unverified_research_draft',
]);

test('all 20 dossiers remain bilingual and unpublished', () => {
  assert.equal(data.circuits.length, 20);
  assert.equal(new Set(data.circuits.map((c) => c.circuit_id)).size, 20);
  assert.equal(data.status, 'research_only');
  assert.notEqual(data.publication, 'published');

  for (const circuit of data.circuits) {
    assert.equal(circuit.publication, 'unpublished', circuit.circuit_id);
    assert.ok(circuit.moments.length >= 3, circuit.circuit_id);
    const years = circuit.moments.map((m) => m.year);
    assert.equal(new Set(years).size, years.length, circuit.circuit_id);

    for (const locale of ['uk', 'en']) {
      assert.ok(circuit.editorial_intro[locale].trim().length >= 30, circuit.circuit_id);
    }
    for (const moment of circuit.moments) {
      assert.ok(Number.isInteger(moment.year), circuit.circuit_id);
      for (const locale of ['uk', 'en']) {
        assert.ok(moment.title[locale]?.trim().length > 5, circuit.circuit_id);
        assert.ok(moment.narrative[locale]?.trim().length > 30, circuit.circuit_id);
      }
      assert.ok(permittedReviews.has(moment.review_status), circuit.circuit_id);
      assert.ok(moment.source_granularity?.trim().length > 5, circuit.circuit_id);
      assert.ok(Array.isArray(moment.sources), circuit.circuit_id);
      assert.ok(moment.sources.length >= 1, `${circuit.circuit_id} ${moment.year}`);
      assert.equal(new Set(moment.sources).size, moment.sources.length, circuit.circuit_id);
      for (const url of moment.sources) {
        const parsed = new URL(url);
        assert.equal(parsed.protocol, 'https:', url);
        assert.ok(parsed.hostname, url);
      }
    }
    for (const corner of circuit.corner_names) {
      if (corner.turn_number !== null) {
        assert.ok(Number.isInteger(corner.turn_number) && corner.turn_number > 0, circuit.circuit_id);
        assert.ok(corner.configuration_id, circuit.circuit_id);
      }
    }
  }
});

test('all 105 drafts have leads, but no review status implies publication', () => {
  const moments = data.circuits.flatMap((c) => c.moments);
  assert.equal(moments.length, 105);
  assert.equal(moments.filter((m) => m.sources.length > 0).length, 105);
  assert.ok(moments.some((m) => m.review_status === 'unverified_research_draft'));
  assert.ok(moments.some((m) => m.review_status === 'official_classification_checked_interpretation_pending'));
  assert.ok(data.publication.includes('blocked'));
});
