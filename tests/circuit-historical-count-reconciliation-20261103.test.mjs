import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalHistoricalCountSourcePage, historicalCornerCountObservations as observations, historicalCornerCountReviewByCircuit as reviews } from '../apps/web/src/components/editorial/circuit-historical-counts.ts';
import { historicalCornerEvidenceWorklistByCircuit } from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('17 sourced count observations cover all seven venues; seven routes remain publication-gated', () => {
  assert.equal(observations.length, 17);
  assert.equal(new Set(observations.map(x=>x.circuit_id)).size, 7);
  assert.equal(reviews.length, 7);
  for (const x of observations) {
    assert.ok(Number.isInteger(x.turns) && x.turns > 0);
    assert.match(x.source_url, /^https:\/\//);
    assert.ok(x.locator.length > 25 && x.caveat.en.length > 25);
    assert.match(x.caveat.uk, /[А-Яа-яІіЇїЄєҐґ]/);
  }
  for (const r of reviews) {
    assert.equal(r.independently_authenticated_numbered_map, false);
    assert.equal(r.per_apex_crosswalk_verified, false);
    assert.equal(r.media_reuse_approved, false);
    assert.equal(r.publication_allowed, false);
    assert.equal(hasPublicationReadyCornerGuide(r.circuit_id), false);
    assert.ok(r.review_request.en.length > 90);
    assert.match(r.review_request.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.ok(r.same_layout_observations.every(x=>x.layout_id===r.layout_id && x.period===r.historical_period));
    assert.ok(r.excluded_other_era_observations.every(x=>x.layout_id!==r.layout_id || x.period!==r.historical_period));
    assert.deepEqual(historicalCornerEvidenceWorklistByCircuit.find(x=>x.circuit_id===r.circuit_id).corner_count_reconciliation, r);
  }
});
test('Dallas, Ain-Diab and Charade conflicts cannot leak modern or later geometry', () => {
  const by=id=>reviews.find(x=>x.circuit_id===id);
  assert.deepEqual(by('dallas').competing_same_layout_counts,[12,23,24]);
  assert.deepEqual(by('ain-diab').competing_same_layout_counts,[11,15,18]);
  assert.deepEqual(by('clermont-ferrand').competing_same_layout_counts,[48,51]);
  assert.deepEqual(by('clermont-ferrand').excluded_other_era_observations.map(x=>x.turns),[18]);
  assert.deepEqual(by('detroit').competing_same_layout_counts,[24]);
  assert.deepEqual(by('detroit').excluded_other_era_observations.map(x=>x.turns).sort((a,b)=>a-b),[17,22]);
  assert.equal(reviews.filter(x=>x.count_disagreement_unresolved).length,5);
  assert.deepEqual(reviews.filter(x=>x.no_count_comparison_available).map(x=>x.circuit_id).sort(),[]);
});

test('Porto, Sebring and Pescara period counts are research-only and page conflicts are not independent witnesses', () => {
  const by = id => reviews.find(x => x.circuit_id === id);
  assert.deepEqual(by('pescara').competing_same_layout_counts, [24]);
  assert.deepEqual(by('porto').competing_same_layout_counts, [14, 19]);
  assert.deepEqual(by('sebring').competing_same_layout_counts, [12, 17]);
  assert.equal(by('pescara').historical_period, '1957');
  assert.equal(by('porto').historical_period, '1958–1960');
  assert.equal(by('sebring').historical_period, '1959');
  for (const id of ['porto', 'sebring']) {
    const route = by(id);
    assert.equal(route.distinct_source_pages, 1, id);
    assert.equal(route.same_page_count_conflicts.length, 1, id);
    assert.deepEqual(route.same_page_count_conflicts[0].reported_counts, route.competing_same_layout_counts);
    assert.equal(route.count_authenticated_against_period_numbered_map, false);
  }
  assert.equal(by('pescara').distinct_source_pages, 1);
  assert.deepEqual(by('pescara').same_page_count_conflicts, []);
  assert.equal(by('pescara').count_authenticated_against_period_numbered_map, false);
  assert.equal(reviews.filter(x => x.same_page_count_conflicts.length > 0).length, 5);
  assert.equal(by('dallas').distinct_source_pages, 2);
  assert.equal(by('ain-diab').distinct_source_pages, 2);
  assert.equal(by('clermont-ferrand').distinct_source_pages, 1);
  assert.equal(by('detroit').distinct_source_pages, 1);
  assert.deepEqual(by('detroit').same_page_count_conflicts, []);
  for (const route of reviews) {
    assert.equal(route.count_authenticated_against_period_numbered_map, false);
    assert.equal(route.publication_allowed, false);
    assert.equal(hasPublicationReadyCornerGuide(route.circuit_id), false);
  }
});

// A publisher/page count must never be mistaken for an authenticated period map.
test('publisher diversity is tracked separately from authenticated map witnesses', () => {
  const by = id => reviews.find(x => x.circuit_id === id);
  for (const route of reviews) {
    const hosts = new Set(route.same_layout_observations.map(x => new URL(x.source_url).hostname.toLowerCase().replace(/^www\./, '')));
    assert.equal(route.distinct_source_publishers, hosts.size);
    assert.ok(route.distinct_source_publishers <= route.distinct_source_pages);
    assert.equal(route.independent_period_map_witnesses, 0);
    assert.equal(route.publication_allowed, false);
  }
  assert.equal(by('dallas').distinct_source_publishers, 2);
  assert.equal(by('porto').distinct_source_publishers, 1);
  assert.equal(by('sebring').distinct_source_publishers, 1);
});

// A database-derived count and a secondary headline from the same page must
// remain competing observations, not corroborating numbered period maps.
test('same-page conflicts retain distinct evidence roles and do not certify historical turns', () => {
  const by = id => reviews.find(x => x.circuit_id === id);
  for (const id of ['dallas', 'ain-diab', 'clermont-ferrand', 'porto', 'sebring']) {
    const route = by(id);
    const conflictingPages = route.same_page_count_conflicts;
    assert.equal(conflictingPages.length, 1, id);
    const conflict = conflictingPages[0];
    // source_page is already a canonical document key, not necessarily an absolute URL.
    // Use the production canonicalizer for both sides; never call new URL() on that key.
    const related = route.same_layout_observations.filter(x =>
      canonicalHistoricalCountSourcePage(x.source_url) === conflict.source_page
    );
    assert.ok(related.length >= 2, id);
    assert.ok(related.some(x => x.source_family === 'f1db_derivative'), id);
    assert.ok(related.some(x => x.source_family === 'secondary_summary'), id);
    assert.equal(route.independent_period_map_witnesses, 0, id);
    assert.equal(route.per_apex_crosswalk_verified, false, id);
    assert.equal(route.media_reuse_approved, false, id);
  }
});


test('count evidence uses the map-audit document identity and rejects unsafe URLs', () => {
  const canonical = canonicalHistoricalCountSourcePage;
  assert.equal(canonical('https://www.lapledger.org/circuits/dallas/?utm_source=review#map'),
    canonical('https://lapledger.org/circuits/dallas'));
  assert.notEqual(
    canonical('https://www.gdecarli.it/php2/circuit.php?var1=1993&var2=2'),
    canonical('https://www.gdecarli.it/php2/circuit.php?var1=1993&var2=3'),
    'different archive selectors must not collapse into a single historical map'
  );
  assert.equal(
    canonical('https://gdecarli.it/php2/circuit.php?var2=2&var1=1993&utm_campaign=a'),
    canonical('https://www.gdecarli.it/php2/circuit.php?var1=1993&var2=2'),
    'selector ordering and tracking parameters must not create extra documents'
  );
  for (const url of [
    'http://lapledger.org/circuits/dallas',
    'https://user:pass@lapledger.org/circuits/dallas',
    'https://lapledger.org:8443/circuits/dallas',
  ]) assert.throws(() => canonical(url), /HTTPS URL without credentials or a custom port/);
});
