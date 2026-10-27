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
  assert.equal(
    moments.filter((m) => m.review_status === 'unverified_research_draft').length,
    0,
    'all twenty dossiers must now have source leads',
  );
  assert.equal(
    moments.filter((m) => m.review_status === 'source_checked_research_draft').length,
    105,
    'first-pass source checks are not independent editorial approval',
  );
  assert.ok(data.publication.includes('blocked'));
});

test('second-ten editorial pass retains event-specific evidence and UK/EN narrative', () => {
  const reviewed = [
    ['red-bull-ring', 1982],
    ['barcelona-catalunya', 1996],
    ['barcelona-catalunya', 2016],
    ['albert-park', 1996],
    ['marina-bay', 2008],
    ['bahrain', 2004],
    ['bahrain', 2020],
    ['shanghai', 2004],
    ['shanghai', 2012],
    ['yas-marina', 2021],
    ['cota', 2012],
    ['cota', 2018],
    ['sepang', 2012],
    ['istanbul-park', 2020],
    ['istanbul-park', 2006],
  ];
  for (const [id, year] of reviewed) {
    const circuit = data.circuits.find((c) => c.circuit_id === id);
    const event = circuit?.moments.find((m) => m.year === year);
    assert.ok(event, `${id} ${year}`);
    assert.equal(event.review_status, 'source_checked_research_draft');
    assert.equal(event.sources.length >= 2, true, `${id} ${year}`);
    assert.equal(event.sources.some((url) => url.includes('greatest-races-best-25')), false);
    assert.equal(event.narrative.en.length >= 160, true, `${id} ${year} en`);
    assert.equal(event.narrative.uk.length >= 150, true, `${id} ${year} uk`);
  }
});
