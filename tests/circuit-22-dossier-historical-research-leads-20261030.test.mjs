import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dir = '../docs/editorial/circuit-experience-v3/';
const files = [
  'EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const dossiers = files.flatMap(name =>
  JSON.parse(readFileSync(new URL(dir + name, import.meta.url), 'utf8')).circuits,
);
const newResearchLeads = new Set([
  'ain-diab', 'anderstorp', 'buenos-aires', 'clermont-ferrand',
  'dijon', 'jacarepagua', 'mosport', 'montjuic', 'jarama', 'jerez',
  'monaco', 'madring', 'pedralbes', 'pescara', 'porto', 'reims',
  'riverside', 'rouen', 'sebring', 'spa-francorchamps', 'zeltweg', 'zolder',
  'aida', 'dallas', 'aintree', 'avus', 'caesars-palace',
]);
const expectedRewrites = new Map([
  ['aida:1', ['Mika Häkkinen', 'Мікою Гаккіненом']],
  ['aida:4', ['final pit stop', 'останнього піт-стопу']],
  ['aintree:3', ['Tony Brooks', 'Тоні Брукс']],
  ['avus:1', ['two heats', 'два заїзди']],
  ['ain-diab:3', ['lap 39', '39-му колі']],
  ['ain-diab:5', ['engine failed', 'двигун']],
  ['dijon:1', ['lap 46', '46-му колі']],
  ['dijon:2', ['engine hesitated', 'двигун']],
  ['montjuic:1', ['Montjuïc barriers', 'огорожах Монжуїка']],
  ['pedralbes:5', ['clutch trouble', 'зі зчепленням']],
  ['spa-francorchamps:1', ['Jackie Stewart', 'Джекі Стюарта']],
  ['reims:3', ['did not finish', 'не дістався']],
]);

test('all 33 expansion research dossiers keep 165 bilingual scenes with separate historical leads and closed publication', () => {
  assert.equal(dossiers.length, 33);
  assert.equal(new Set(dossiers.map(row => row.circuit_id)).size, 33);
  assert.equal(dossiers.reduce((sum, row) => sum + row.stories.length, 0), 165);
  let newScenes = 0;
  let verifiedRewrites = 0;
  const independentLinks = new Set();
  for (const dossier of dossiers) {
    assert.equal(dossier.stories.length, 5, dossier.circuit_id);
    for (const story of dossier.stories) {
      const key = dossier.circuit_id + ':' + story.story_index;
      assert.ok(story.source_urls.some(url => url.includes('formula1.com/en/results/')), key + '/classification');
      assert.ok(story.historical_sources?.length >= 1, key + '/historical');
      assert.ok(story.historical_sources.every(url => /^https:\/\//.test(url) && !url.includes('formula1.com')), key + '/independent-domain');
      assert.ok(story.historical_source_locator?.length > 35, key + '/locator');
      assert.equal(story.historical_review_status, 'pending_independent_claim_review', key);
      assert.equal(story.independent_approval, false, key);
      assert.equal(story.publication, 'blocked', key);
      assert.ok(story.narrative.en.length > 50 && story.narrative.uk.length > 50, key + '/bilingual');
      for (const url of story.historical_sources) independentLinks.add(url);
      if (newResearchLeads.has(dossier.circuit_id)) {
        newScenes++;
        assert.equal(story.historical_evidence_scope, 'race_context_lead_not_scene_claim_verified', key);
        assert.match(story.historical_source_locator, /classification.*review pending/i, key);
      }
      const anchors = expectedRewrites.get(key);
      if (anchors) {
        assert.ok(story.narrative.en.includes(anchors[0]), key + '/en');
        assert.ok(story.narrative.uk.includes(anchors[1]), key + '/uk');
        verifiedRewrites++;
      }
    }
  }
  assert.equal(newResearchLeads.size, 27);
  assert.equal(newScenes, 135);
  assert.equal(verifiedRewrites, 12);
  assert.ok(independentLinks.size >= 30);
});
