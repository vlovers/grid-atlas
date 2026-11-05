import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const dir = 'docs/editorial/circuit-experience-v3/';
const queue = read(dir + 'NEXT20_CLAIM_REVIEW_QUEUE.json');
const paths = [
  'NEXT20_16_EVENT_SOURCE_CROSSCHECK_20261105.json',
  'NEXT20_09_EVENT_SOURCE_CROSSCHECK_20261105.json',
  'NEXT20_05_EVENT_SOURCE_CROSSCHECK_20261105.json',
  'NEXT20_03_UNIQUE_SOURCE_CROSSCHECK_20261105.json'
];
const batches = paths.map(path => read(dir + path));
const records = batches.flatMap(batch => batch.records);
const queueKey = record => record.circuit_id + ':' + record.event_year;
const singleSource = new Map(queue.records.filter(record => record.source_urls.length === 1).map(record => [queueKey(record), record]));

test('30 distinct source-linked EN/UK historic event review leads remain unpublished', () => {
  assert.equal(records.length, 30);
  assert.equal(new Set(records.map(record => record.claim_id)).size, 30);
  assert.equal(singleSource.size >= 30, true);
  for (const batch of batches) {
    assert.equal(batch.count, batch.records.length);
    assert.equal(batch.status, 'research_only');
    assert.equal(batch.publication_allowed, false);
    assert.equal(batch.independent_human_approval, false);
    assert.equal(batch.media_rights_approved, false);
    assert.equal(batch.source_release, 'F1DB v2026.17.0');
  }
  for (const entry of records) {
    assert.equal(entry.claim_id, queueKey(entry));
    assert.ok(singleSource.has(entry.claim_id), entry.claim_id + ' must be an existing single-source claim');
    assert.ok(/^https:\/\//.test(entry.source_url), entry.claim_id);
    assert.ok(entry.source_role.length > 8, entry.claim_id);
    assert.ok(entry.claim_specific_review_note_en.length > 40, entry.claim_id);
    assert.ok(entry.claim_specific_review_note_uk.length > 30, entry.claim_id);
    assert.equal(entry.verification_status, 'research_lead_crosscheck');
    assert.equal(entry.independent_human_approval, false);
    assert.equal(entry.publication_allowed, false);
    assert.equal(entry.media_rights_approved, false);
    assert.equal(singleSource.get(entry.claim_id).independent_editorial_approval, false);
  }
});
