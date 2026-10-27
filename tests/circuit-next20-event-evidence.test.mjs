import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dossier = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', 'utf8'));
const audit = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT20_EVENT_EVIDENCE_PASS_20261027.json', 'utf8'));

test('88 event-specific evidence checks cover all 20 circuits', () => {
  assert.equal(audit.publication, 'blocked');
  assert.equal(audit.reviewed_events.length, 88);
  assert.equal(audit.remaining.other_event_drafts, 17);
  assert.equal(audit.remaining.claim_level_approval, 0);
  assert.equal(audit.remaining.feature_layout_bindings_verified, 0);
  assert.equal(audit.remaining.media_rights_approved, 0);
  const seen = new Set();
  const circuits = new Set();
  let rewritten = 0;
  for (const item of audit.reviewed_events) {
    const key = item.circuit_id + '/' + item.year;
    assert.ok(!seen.has(key), key);
    seen.add(key);
    circuits.add(item.circuit_id);
    if (item.rewritten_this_pass) rewritten++;
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
  assert.equal(circuits.size, 20);
  assert.equal(rewritten, 63);
  assert.equal(dossier.publication, 'blocked_pending_independent_historical_review');
  assert.equal(audit.reviewed_events.length + audit.remaining.other_event_drafts, 105);
  const hungary1986 = dossier.circuits.find(c => c.circuit_id === 'hungaroring').moments.find(m => m.year === 1986);
  assert.ok(hungary1986.sources.some(url => url.includes('do-you-remember-piquets-amazing-overtake')));
  const singapore2019 = dossier.circuits.find(c => c.circuit_id === 'marina-bay').moments.find(m => m.year === 2019);
  assert.ok(singapore2019.sources.some(url => url.includes('race-report-highlight-singapore-grand-prix-2019')));
});

test('evidence crosswalk and claim queue agree on 88 reviewed events and zero approvals', () => {
 const queue = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT20_CLAIM_REVIEW_QUEUE.json', 'utf8'));
 assert.equal(queue.summary.total, 105);
 assert.equal(queue.summary.second_pass_event_specific_checked, 88);
 assert.equal(queue.summary.second_pass_rewritten, 63);
 assert.equal(queue.summary.independent_approved, 0);
 const keys = new Set(audit.reviewed_events.map(x => x.circuit_id + '/' + x.year));
 assert.equal(keys.size, 88);
 for (const record of queue.records) {
  const circuit = dossier.circuits.find(c => c.circuit_id === record.circuit_id);
  const story = circuit.moments.find(m => m.year === record.event_year);
  assert.equal(record.event_title_en, story.title.en);
  assert.deepEqual(record.source_urls, story.sources);
  assert.equal(record.independent_editorial_approval, false);
  assert.equal(record.media_rights_approval, false);
 }
});
