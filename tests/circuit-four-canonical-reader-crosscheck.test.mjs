import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const stories = read('apps/web/src/components/editorial/circuit-extra-stories.json');
const evidence = read('docs/editorial/circuit-experience-v3/FOUR_CANONICAL_CIRCUIT_READER_CROSSCHECK_20261030.json');

test('four underwritten EN/UK circuit cards retain event-specific evidence and no approval', () => {
  assert.equal(evidence.entries.length, 4);
  assert.equal(new Set(evidence.entries.map((entry) => entry.circuit_id)).size, 4);
  assert.equal(evidence.independent_human_approval, false);
  assert.equal(evidence.publication_allowed, false);
  assert.equal(evidence.photo_license_assessed, false);
  for (const entry of evidence.entries) {
    const story = stories.find((item) => item.id === entry.circuit_id);
    assert.ok(story, entry.circuit_id);
    assert.equal(story.source, entry.classification_or_venue_source_url);
    assert.ok(entry.independent_narrative_sources.length >= 1);
    for (const source of entry.independent_narrative_sources) assert.match(source, /^https:\/\/[^ ]+$/);
    assert.equal(entry.review_status, 'research_crosscheck_only');
    assert.equal(entry.independent_human_approval, false);
    assert.equal(entry.publication_allowed, false);
    assert.equal(entry.photo_license_assessed, false);
    for (const locale of ['en', 'uk']) {
      assert.ok(story.description[locale].length > 430, entry.circuit_id + ' ' + locale);
      assert.ok(story.description[locale].includes(entry.text_checks[locale]), entry.circuit_id + ' ' + locale);
    }
  }
});
