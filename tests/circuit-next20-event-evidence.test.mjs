import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dossier = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', 'utf8'));
const audit = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT20_EVENT_EVIDENCE_PASS_20261027.json', 'utf8'));

test('11 event-specific evidence checks correspond to current bilingual manuscripts', () => {
  assert.equal(audit.publication, 'blocked');
  assert.equal(audit.reviewed_events.length, 11);
  assert.equal(audit.remaining.other_event_drafts, 94);
  assert.equal(audit.remaining.claim_level_approval, 0);
  assert.equal(audit.remaining.feature_layout_bindings_verified, 0);
  assert.equal(audit.remaining.media_rights_approved, 0);
  const seen = new Set();
  for (const item of audit.reviewed_events) {
    const key = item.circuit_id + '/' + item.year;
    assert.ok(!seen.has(key), key);
    seen.add(key);
    const circuit = dossier.circuits.find(c => c.circuit_id === item.circuit_id);
    assert.ok(circuit, key);
    const moment = circuit.moments.find(m => m.year === item.year && m.title.en === item.title_en);
    assert.ok(moment, key);
    assert.ok(moment.sources.includes(item.evidence_url), key);
    assert.equal(moment.review_status, 'source_checked_research_draft', key);
    assert.ok(moment.narrative.en.length > 130, key);
    assert.ok(moment.narrative.uk.length > 130, key);
    assert.ok(item.claims_checked_against_primary_publisher.length > 25, key);
    assert.ok(item.remaining_limitation.length > 20, key);
    assert.equal(item.editorial_approval, false, key);
    assert.equal(item.media_rights_approved, false, key);
  }
  assert.equal(dossier.publication, 'blocked_pending_independent_historical_review');
});
