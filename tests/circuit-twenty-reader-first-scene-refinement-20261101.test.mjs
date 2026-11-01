import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = '../docs/editorial/circuit-experience-v3/';
const files = [
  'EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const dossiers = files.flatMap(file =>
  JSON.parse(readFileSync(new URL(root + file, import.meta.url), 'utf8')).circuits,
);
const edited = {
  aida: [
    [1, "Senna's zero completed laps", 'Нуль пройдених кіл'],
    [2, 'Berger inherited second', 'Бергер став другим'],
    [3, "Jordan's first podium depended", 'Jordan здобула перший подіум'],
  ],
  dallas: [
    [2, "The report separates Rosberg's pass", 'Репортаж розділяє три'],
    [3, 'Before the heat-exhaustion images', 'До драматичних кадрів'],
    [5, 'For Osella', 'Для Osella'],
  ],
  'ain-diab': [
    [1, 'fastest-lap bonus', 'очко за найшвидше коло'],
    [2, "Hawthorn won the drivers' championship", 'Готорн виграв чемпіонат'],
    [3, 'instruction to give up second place', 'рішення віддати друге місце'],
  ],
  anderstorp: [[5, 'The Cosworth failure increased', 'Ще до поломки Cosworth']],
  rouen: [
    [2, 'Starting eleventh', 'Стартувавши одинадцятим'],
    [5, 'The order matters', 'Послідовність важлива'],
  ],
  porto: [
    [3, "Porto's cobbles", 'бруківку й трамвайні колії'],
    [4, 'did not pass him', 'не випередила його'],
  ],
  sebring: [[4, 'By pushing the stranded Cooper', 'Доштовхавши зупинений Cooper']],
  monaco: [
    [1, 'Attrition opened the door', 'Паніс сам дістався'],
    [2, 'The final margin records', 'Фінішний розрив показує'],
    [3, 'Unlike Panis', 'На відміну від Паніса'],
    [4, 'The qualifying margin was real', 'Швидкість у кваліфікації'],
    [5, 'The sequence was cruel', 'Обидва лідери втратили'],
  ],
};

test('20 revised EN/UK scenes retain distinct grounded chronology without opening publication', () => {
  assert.equal(dossiers.length, 33);
  assert.equal(new Set(dossiers.map(d => d.circuit_id)).size, 33);
  assert.equal(dossiers.reduce((n, d) => n + d.stories.length, 0), 165);
  let reviewed = 0;
  for (const [id, expected] of Object.entries(edited)) {
    const dossier = dossiers.find(d => d.circuit_id === id);
    assert.ok(dossier, id);
    assert.equal(new Set(dossier.stories.map(s => s.historical_source_locator)).size, 5, id);
    for (const [number, enAnchor, ukAnchor] of expected) {
      const scene = dossier.stories.find(s => s.story_index === number);
      assert.ok(scene, id + ':' + number);
      assert.ok(scene.narrative.en.includes(enAnchor), id + ':en:' + number);
      assert.ok(scene.narrative.uk.includes(ukAnchor), id + ':uk:' + number);
      assert.ok(scene.narrative.en.trim().split(/\s+/).length >= 65, id + ':en length:' + number);
      assert.ok(scene.narrative.uk.trim().split(/\s+/).length >= 55, id + ':uk length:' + number);
      assert.ok(scene.source_urls.some(u => u.includes('formula1.com/en/results/')), id + ':classification');
      assert.ok(new Set(scene.historical_sources.map(u => new URL(u).hostname)).size >= 2, id + ':historical publishers');
      assert.ok(scene.historical_source_locator.length >= 70, id + ':locator');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review', id);
      assert.equal(scene.independent_approval, false, id);
      assert.equal(scene.publication, 'blocked', id);
      reviewed++;
    }
  }
  assert.equal(reviewed, 20);
});

test('Monaco and Caesars Palace retain ten differentiated scene-specific source notes', () => {
  for (const id of ['monaco', 'caesars-palace']) {
    const dossier = dossiers.find(d => d.circuit_id === id);
    assert.ok(dossier);
    assert.equal(new Set(dossier.stories.map(s => s.historical_source_locator)).size, 5);
    for (const scene of dossier.stories) {
      assert.match(scene.historical_source_locator, /Grandprix\.com/i);
      assert.match(scene.historical_source_locator, /claim review pending/i);
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
    }
  }
});
