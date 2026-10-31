import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = '../docs/editorial/circuit-experience-v3/';
const files = [
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const dossiers = files.flatMap(name =>
  JSON.parse(readFileSync(new URL(base + name, import.meta.url), 'utf8')).circuits,
);
const expected = [
  'bremgarten',
  'bugatti',
  'east-london',
  'monsanto',
  'mont-tremblant',
  'nivelles',
];

test('six formerly one-source dossiers have 30 bilingual scenes with separate historical evidence', () => {
  let totalScenes = 0;
  let historicalReferences = 0;
  for (const id of expected) {
    const dossier = dossiers.find(row => row.circuit_id === id);
    assert.ok(dossier, id);
    assert.equal(dossier.stories.length, 5, id);
    for (const story of dossier.stories) {
      totalScenes++;
      assert.ok(story.source_urls.length >= 1, id + '/classification');
      assert.ok(story.historical_sources.length >= 1, id + '/historical');
      historicalReferences += story.historical_sources.length;
      if (['monsanto', 'mont-tremblant'].includes(id)) {
        assert.ok(story.historical_sources.length >= 2, id + '/corroborating race reports');
        assert.equal(new Set(story.historical_sources).size, story.historical_sources.length, id + '/unique sources');
      }
      assert.ok(story.historical_source_locator.length >= 25, id + '/locator');
      assert.equal(story.historical_review_status, 'pending_independent_claim_review');
      assert.equal(story.independent_approval, false, id + '/approval');
      assert.equal(story.publication, 'blocked', id + '/publication');
      for (const language of ['en', 'uk']) {
        assert.ok(story.narrative[language].length > 75, id + '/' + language);
      }
      for (const url of story.historical_sources) {
        const host = new URL(url).hostname;
        assert.ok(['www.motorsportmagazine.com', 'www.grandprix.com', ...(id === 'east-london' ? ['www.bbc.co.uk'] : [])].includes(host), id + '/' + host);
        assert.ok(!story.source_urls.includes(url), id + '/classification separation');
      }
    }
  }
  assert.equal(totalScenes, 30);
  assert.ok(historicalReferences >= 55, 'historical references must not regress after new corroboration');
});
