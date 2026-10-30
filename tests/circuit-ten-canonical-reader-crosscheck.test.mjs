import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const stories = read('apps/web/src/components/editorial/circuit-extra-stories.json');
const evidence = read('docs/editorial/circuit-experience-v3/TEN_CANONICAL_CIRCUIT_READER_CROSSCHECK_20261030.json');

test('ten canonical EN/UK circuit cards have traceable independent race context without publication approval', () => {
  assert.equal(evidence.entries.length, 10);
  assert.equal(new Set(evidence.entries.map((entry) => entry.circuit_id)).size, 10);
  assert.equal(evidence.independent_human_approval, false);
  assert.equal(evidence.publication_allowed, false);
  assert.equal(evidence.photo_license_assessed, false);
  for (const entry of evidence.entries) {
    const story = stories.find((item) => item.id === entry.circuit_id);
    assert.ok(story, entry.circuit_id);
    assert.equal(story.source, entry.classification_source_url);
    assert.match(entry.independent_source_url, /^https:\/\/www\.(motorsportmagazine|grandprix)\.com\//);
    assert.equal(entry.review_status, 'research_crosscheck_only');
    assert.equal(entry.independent_human_approval, false);
    assert.equal(entry.publication_allowed, false);
    assert.equal(entry.photo_license_assessed, false);
    for (const locale of ['en', 'uk']) {
      assert.ok(story.title[locale].length > 15, entry.circuit_id + ' ' + locale + ' title');
      assert.ok(story.description[locale].length > 420, entry.circuit_id + ' ' + locale + ' narrative');
      assert.ok(story.description[locale].includes(entry.text_checks[locale]), entry.circuit_id + ' ' + locale + ' event');
    }
  }
});
