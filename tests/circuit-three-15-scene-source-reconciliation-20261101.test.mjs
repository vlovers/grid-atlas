import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const files = [
  'EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
];
const dossiers = files.flatMap((file) => {
  const document = JSON.parse(readFileSync(new URL(file, root), 'utf8'));
  assert.equal(document.publication, 'blocked');
  return document.circuits;
});
const circuits = ['aida', 'caesars-palace', 'bugatti'];

function scene(id, index) {
  return dossiers.find((d) => d.circuit_id === id).stories[index - 1];
}

test('15 revised Aida, Caesars Palace and Bugatti research scenes remain distinct, bilingual and unpublished', () => {
  let count = 0;
  for (const id of circuits) {
    const dossier = dossiers.find((d) => d.circuit_id === id);
    assert.ok(dossier, id);
    assert.deepEqual(dossier.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(dossier.stories.map((s) => s.historical_source_locator)).size, 5, id);
    assert.equal(new Set(dossier.stories.map((s) => s.narrative.en)).size, 5, id);
    for (const story of dossier.stories) {
      count++;
      assert.ok(story.narrative.en.trim().split(/\s+/).length >= 65, id + '/' + story.story_index + '/en');
      assert.ok(story.narrative.uk.trim().split(/\s+/).length >= 55, id + '/' + story.story_index + '/uk');
      assert.doesNotMatch(story.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/, id + '/' + story.story_index);
      assert.equal(story.historical_review_status, 'pending_independent_claim_review');
      assert.equal(story.historical_evidence_scope, 'race_context_lead_not_scene_claim_verified');
      assert.equal(story.independent_approval, false);
      assert.equal(story.publication, 'blocked');
      assert.ok(story.source_urls.some((url) => url.includes('formula1.com/en/results/')));
      assert.ok(new Set(story.historical_sources.map((url) => new URL(url).hostname)).size >= 2);
      assert.match(story.historical_source_locator, /classification/i);
      assert.match(story.historical_source_locator, /review pending|pending.*review/i);
    }
  }
  assert.equal(count, 15);
});

test('race context is distinguished from classification and unresolved accounts stay unresolved', () => {
  assert.match(scene('aida', 1).narrative.en, /Mika Häkkinen/);
  assert.ok(scene('aida', 1).historical_sources.some((url) => url.includes('motorsport.com/f1/news/')));
  for (const index of [4, 5]) {
    const item = scene('aida', index);
    assert.match(item.narrative.en, /Grandprix.com/);
    assert.match(item.narrative.en, /Autosport/);
    assert.match(item.narrative.en, /three/);
    assert.match(item.narrative.en, /four/);
    assert.match(item.narrative.uk, /три/);
    assert.match(item.narrative.uk, /чотири/);
  }
  const cheever = scene('caesars-palace', 5);
  assert.match(cheever.narrative.en, /Autosport/);
  assert.match(cheever.narrative.en, /Motor Sport/);
  assert.ok(cheever.historical_sources.some((url) => url.includes('autosport.com/f1/news/')));
  assert.match(scene('bugatti', 1).narrative.en, /4\.422-kilometre/);
  assert.match(scene('bugatti', 1).narrative.uk, /4,422/);
  assert.match(scene('bugatti', 4).narrative.en, /ZF/);
  assert.match(scene('bugatti', 5).narrative.uk, /мастило/);
});
