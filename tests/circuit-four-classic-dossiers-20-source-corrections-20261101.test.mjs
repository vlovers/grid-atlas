import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const anchors = {
  pedralbes: [['Schell led the opening lap', 'Шелл очолив перше коло'], ['six laps left', 'шість кіл'], ['twelve laps remaining', 'дванадцять кіл'], ['Mieres and Kling a lap behind', "М'єрес і Клінг поступилися"], ['Harry Schell, not Ascari', 'Найшвидше коло насправді встановив Гаррі Шелл']],
  pescara: [['Musso led the first lap', 'Муссо очолював гонку'], ['On lap ten', 'На десятому колі'], ['Jean Behra\'s Maserati had already stopped', 'Maserati Жана Бери зупинилася'], ['bodywork coming loose', 'розхитувався кузов'], ['precautionary oil stop', 'профілактичну зупинку']],
  porto: [['period report calls the leaking liquid fuel', 'репортаж називає рідину пальним'], ['by lap 33', '33-му колі'], ['opening six laps', 'шести початкових кіл'], ['opening lap', 'першому колі'], ['51st lap', '51-ше коло']],
  reims: [['lap thirteen', 'тринадцятому колі'], ['61st lap', '61-ше коло'], ['stopped in smoke near Thillois', 'зупинився в диму'], ['eased the Thillois hairpin', 'пом\'якшили шпильку Thillois'], ['ran out of fuel on the final straight', 'закінчилося пальне']],
};
test('20 classic-road-race scenes correct claims in both languages and remain publication-blocked', () => {
  let total = 0;
  for (const [id, expected] of Object.entries(anchors)) {
    const circuit = data.circuits.find(c => c.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
    circuit.stories.forEach((scene, i) => {
      total++;
      for (const [lang, anchor] of [['en', expected[i][0]], ['uk', expected[i][1]]]) {
        assert.ok(scene.narrative[lang].includes(anchor), id + '/' + (i + 1) + '/' + lang);
        assert.ok(scene.narrative[lang].trim().split(/\s+/).length >= (lang === 'en' ? 65 : 55));
      }
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
      assert.ok(scene.historical_sources.some(u => u.includes('motorsportmagazine.com')));
      assert.ok(scene.historical_sources.some(u => u.includes('grandprix.com')));
    });
  }
  assert.equal(total, 20);
  const pedralbes = data.circuits.find(c => c.circuit_id === 'pedralbes');
  assert.ok(!pedralbes.stories[4].narrative.uk.includes('Аскарі ще й установив найшвидше коло'));
  const pescara = data.circuits.find(c => c.circuit_id === 'pescara');
  assert.ok(!pescara.stories[0].narrative.en.includes('eventually won, Moss passed'));
  const porto = data.circuits.find(c => c.circuit_id === 'porto');
  assert.match(porto.stories[0].historical_source_locator, /fuel.*oil.*do not resolve/i);
});
