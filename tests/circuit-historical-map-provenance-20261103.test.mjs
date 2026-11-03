import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalHistoricalCountSourcePage, historicalCornerCountReviewByCircuit } from '../apps/web/src/components/editorial/circuit-historical-counts.ts';
import { historicalMapReferenceAudit, historicalMapRightsReviewByCircuit } from '../apps/web/src/components/editorial/circuit-historical-map-audit.ts';
import { historicalCornerEvidenceWorklistByCircuit } from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('publisher page variants cannot inflate independent evidence counts', () => {
  const variants = [
    'https://www.lapledger.org/circuits/porto',
    'https://lapledger.org/circuits/porto/',
    'https://lapledger.org/circuits/porto?source=f1db#layout',
  ];
  assert.equal(new Set(variants.map(canonicalHistoricalCountSourcePage)).size, 1);
  assert.notEqual(canonicalHistoricalCountSourcePage('https://lapledger.org/circuits/sebring'),
    canonicalHistoricalCountSourcePage(variants[0]));
  for (const id of ['porto', 'sebring', 'dallas', 'ain-diab', 'clermont-ferrand']) {
    const row = historicalCornerCountReviewByCircuit.find(x => x.circuit_id === id);
    assert.ok(row.same_page_count_conflicts.length > 0, id);
    assert.equal(row.count_authenticated_against_period_numbered_map, false);
  }
});

test('15 period-specific references cover seven incomplete routes without laundering race results into maps', () => {
  assert.equal(historicalMapReferenceAudit.length, 15);
  assert.equal(historicalMapRightsReviewByCircuit.length, 7);
  assert.equal(new Set(historicalMapReferenceAudit.map(x=>x.source_url)).size, 15);
  assert.equal(historicalMapReferenceAudit.filter(x=>x.source_role==='official_race_result_not_geometry').length, 6);
  assert.equal(historicalMapReferenceAudit.filter(x=>x.recorded_asset_license!==null).length, 1);
  for (const source of historicalMapReferenceAudit) {
    assert.match(source.source_url, /^https:\/\//);
    assert.ok(source.limitation.en.length > 45);
    assert.match(source.limitation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.equal(source.independently_authenticated_period_numbered_map, false);
    assert.equal(source.imported_media_asset, false);
    assert.equal(source.media_reuse_approved, false);
  }
  for (const route of historicalMapRightsReviewByCircuit) {
    assert.ok(route.source_references >= 2);
    assert.equal(route.independently_authenticated_period_numbered_maps, 0);
    assert.equal(route.imported_media_assets, 0);
    assert.equal(route.media_reuse_approved, false);
    assert.equal(route.publication_allowed, false);
    assert.equal(hasPublicationReadyCornerGuide(route.circuit_id), false);
    const worklist = historicalCornerEvidenceWorklistByCircuit.find(x=>x.circuit_id===route.circuit_id);
    assert.deepEqual(worklist.historical_map_and_media_audit, route);
    assert.equal(worklist.corner_count_reconciliation.per_apex_crosswalk_verified, false);
  }
});

test('Sebring 2010 Commons illustration has a documented conditional license, not a period FIA map or release approval', () => {
  const sebring = historicalMapRightsReviewByCircuit.find(x=>x.circuit_id==='sebring');
  assert.equal(sebring.source_references, 3);
  assert.equal(sebring.recorded_license_pages, 1);
  const commons = sebring.references.find(x=>x.source_role==='later_redrawn_historical_map');
  assert.equal(commons.source_published_year, 2010);
  assert.match(commons.recorded_asset_license, /CC BY-SA 3\.0.*GFDL 1\.2\+.*Oliver Pohlmann/);
  assert.equal(commons.independently_authenticated_period_numbered_map, false);
  assert.equal(commons.media_reuse_approved, false);
});
