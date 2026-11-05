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
