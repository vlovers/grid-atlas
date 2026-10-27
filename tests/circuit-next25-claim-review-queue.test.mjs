import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const stories = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next25-research-leads.json','utf8'));
const audit = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT25_CLAIM_REVIEW_QUEUE.json','utf8'));
test('claim review queue represents all 125 unpublished bilingual leads', () => {
  const leads = stories.circuits.flatMap(circuit => circuit.story_leads.map((story, index) => ({circuit, story, index})));
  assert.equal(leads.length, 125);
  assert.equal(audit.records.length, leads.length);
  assert.equal(audit.summary.total, leads.length);
  assert.equal(audit.summary.independently_approved, 0);
  assert.equal(audit.publication, 'blocked');
  const keys = new Set();
  for (const record of audit.records) {
    const key = record.candidate_slug + ':' + record.story_index;
    assert.ok(!keys.has(key), key);
    keys.add(key);
    const circuit = stories.circuits.find(c => c.candidate_slug === record.candidate_slug);
    assert.ok(circuit, key);
    const story = circuit.story_leads[record.story_index];
    assert.ok(story, key);
    assert.equal(record.title_en, story.title.en);
    assert.equal(record.year, story.year ?? null);
    assert.deepEqual(record.source_urls, story.sources);
    assert.equal(record.independent_approval, false);
    assert.equal(record.publication, 'blocked');
    if (record.research_status === 'classification_supported_research_draft') {
      assert.ok(record.review_flags.includes('independent_event_specific_sources_needed'));
    }
  }
  assert.equal(audit.summary.classification_drafts, leads.filter(x => x.story.status === 'classification_supported_research_draft').length);
  assert.equal(audit.summary.undated_topics, leads.filter(x => x.story.year === null).length);
});
