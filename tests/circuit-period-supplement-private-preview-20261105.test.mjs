import assert from 'node:assert/strict';
import test from 'node:test';
import historicRoutes from '../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json' with { type: 'json' };
import { renderCircuitReview, renderHistoricalSupplement } from '../scripts/preview-circuit-v3.mjs';

const originalHistoricIds = ['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring'];
const supplement = historicRoutes.circuits.filter(route => !originalHistoricIds.includes(route.circuit_id));

test('ten unpublished period dossiers retain 20 separate bilingual sections, not ten extra circuits', () => {
  assert.equal(supplement.length, 10);
  assert.equal(supplement.reduce((total, route) => total + route.sections.length, 0), 20);
  assert.equal(historicRoutes.release_authorized, false);
  assert.equal(historicRoutes.image_rights_approved, false);
  for (const route of supplement) {
    assert.equal(route.editorial_reader_preview?.editorial_status, 'research_only', route.circuit_id);
    assert.notEqual(route.editorial_reader_preview?.publication_allowed, true, route.circuit_id);
    for (const locale of ['en', 'uk']) {
      assert.ok(route.editorial_reader_preview?.[locale]?.length > 100, route.circuit_id);
      assert.ok(route.sections.every(section => section.description?.[locale]?.length > 90), route.circuit_id);
    }
  }
});

test('preview keeps exactly 78 circuit identities while exposing supplements only in private noindex review', () => {
  for (const locale of ['en', 'uk']) {
    const html = renderCircuitReview(locale, '/review/secret');
    const extra = renderHistoricalSupplement(locale);
    assert.match(html, /noindex,nofollow,noarchive/);
    assert.equal((html.match(/data-circuit-review="/g) ?? []).length, 78);
    assert.equal((html.match(/data-period-supplement(?=>)/g) ?? []).length, 10);
    assert.equal((html.match(/data-period-supplement-section(?= )/g) ?? []).length, 20);
    assert.ok(html.includes(extra));
    assert.match(extra, /not new|не нові/);
    assert.doesNotMatch(extra, /official_turn_number|publication_allowed=true|<img /);
    for (const route of supplement) {
      assert.ok(html.includes('id="period-supplement-' + route.circuit_id + '"'), route.circuit_id);
      assert.ok(html.includes('href="#period-supplement-' + route.circuit_id + '"'), route.circuit_id);
    }
  }
});

import adjudication from '../docs/editorial/circuit-experience-v3/SEVEN_PERIOD_ROUTES_21_CLAIM_ADJUDICATION_20261105.json' with { type: 'json' };

test('all 21 historical review questions remain bilingual, unique and fail-closed', () => {
  const expectedTypes = ['layout_era', 'geometry', 'race_event'];
  const ids = new Set();
  assert.equal(adjudication.record_count, 21);
  assert.equal(adjudication.records.length, 21);
  assert.equal(adjudication.independent_human_approval, false);
  assert.equal(adjudication.media_rights_approved, false);
  assert.equal(adjudication.publication_allowed, false);
  assert.equal(adjudication.pinned_identity_preserved, true);

  for (const circuitId of originalHistoricIds) {
    const records = adjudication.records.filter(record => record.circuit_id === circuitId);
    assert.deepEqual(records.map(record => record.claim_type).sort(), [...expectedTypes].sort(), circuitId);
    assert.equal(new Set(records.map(record => record.layout_id)).size, 1, circuitId);
    for (const record of records) {
      assert.equal(record.review_id, circuitId + ':' + record.claim_type);
      assert.ok(!ids.has(record.review_id), 'duplicate ' + record.review_id);
      ids.add(record.review_id);
      assert.ok(record.period, record.review_id);
      assert.ok(record.source_leads.length > 0, record.review_id);
      assert.equal(record.source_scope, 'candidate_leads_only_not_adjudicated', record.review_id);
      for (const locale of ['en', 'uk']) {
        assert.ok(record.review_question[locale]?.length > 40, record.review_id + '/' + locale);
      }
      for (const gate of [
        'period_map_authenticated',
        'numbered_apex_verified',
        'media_rights_approved',
        'independent_human_approval',
        'publication_allowed',
      ]) {
        assert.equal(record[gate], false, record.review_id + '/' + gate);
      }
    }
  }
  assert.equal(ids.size, 21);
});

test('source passage observations are research, never human or geometry approval', () => {
  const observed = adjudication.records.filter(record => record.source_passage_observation);
  assert.equal(observed.length, adjudication.source_passage_observations);
  assert.equal(adjudication.source_passage_observations, 21);
  assert.equal(observed.length, adjudication.records.length);
  assert.equal(new Set(observed.map(record => record.review_id)).size, 21);
  for (const record of observed) {
    const observation = record.source_passage_observation;
    assert.ok(record.source_leads.includes(observation.url), record.review_id);
    assert.ok(observation.locator?.length > 20, record.review_id);
    assert.match(observation.url, /^https:\/\//, record.review_id);
    assert.match(observation.accessed_utc_date, /^\d{4}-\d{2}-\d{2}$/, record.review_id);
    assert.ok(observation.review_method?.length > 10, record.review_id);
    assert.ok(observation.scope?.length > 10, record.review_id);
    assert.ok(observation.observation_en?.length > 40, record.review_id);
    assert.ok(observation.observation_uk?.length > 40, record.review_id);
    assert.equal(observation.claim_scope_reviewed, true, record.review_id);
    assert.equal(observation.not_human_signoff, true, record.review_id);
    assert.equal(observation.independent_corroboration_complete, false, record.review_id);
    assert.equal(observation.period_numbered_map_authenticated, false, record.review_id);
  }
  // A contemporary race account or a named bend is not an authenticated FIA apex key.
  for (const record of adjudication.records.filter(record => record.claim_type === 'geometry')) {
    assert.equal(record.numbered_apex_verified, false, record.review_id);
    assert.equal(record.period_map_authenticated, false, record.review_id);
  }
});


test('publication registry has no approvals for unpublished historic route candidates', async () => {
  const { default: publication } = await import('../apps/web/src/components/editorial/circuit-release.json', { with: { type: 'json' } });
  assert.equal(publication.schema_version, 1);
  assert.deepEqual(publication.editions, []);
  assert.equal(adjudication.publication_allowed, false);
  assert.equal(adjudication.independent_human_approval, false);
  assert.equal(adjudication.media_rights_approved, false);
});
