import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const anchors = {
  rouen: [['industrial strike', 'страйк'], ['eleventh', 'одинадцятим'], ['forty-ninth', "дев'ятому"], ['Nürburgring', 'Нюрбургринзі'], ['31–33', '31-го']],
  sebring: [['22', '22'], ['Rob Walker', 'Роба Вокера'], ['precautionary', 'обережної'], ['400 yards', '400 ярдів'], ['pit crews', 'механіки']],
  'spa-francorchamps': [['Bob Bondurant', 'Боб Бондурант'], ['limited-slip differential', 'диференціал'], ['2.4-litre V6', '2,4-літровим V6'], ['endurance result', 'витривалість'], ['Burnenville', 'Burnenville']],
  zeltweg: [['3.2-kilometre', '3,2-кілометрову'], ['lap 47', '47-му'], ['fourteenth', 'чотирнадцятим'], ['driveshaft', 'приводний вал'], ['lap two', 'другому колі']],
};

test('20 EN/UK research scenes retain distinct historical anchors and fail-closed review', () => {
  for (const [id, expected] of Object.entries(anchors)) {
    const circuit = data.circuits.find((item) => item.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((scene) => scene.story_index), [1, 2, 3, 4, 5]);
    circuit.stories.forEach((scene, index) => {
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
      assert.ok(scene.historical_sources.length >= 2, id + ':' + scene.story_index);
      for (const [locale, anchor] of [['en', expected[index][0]], ['uk', expected[index][1]]]) {
        assert.ok(scene.narrative[locale].includes(anchor), id + ':' + scene.story_index + ':' + locale);
        assert.ok(scene.narrative[locale].trim().split(/\\s+/).length >= (locale === 'en' ? 65 : 55));
      }
    });
    for (const locale of ['en', 'uk']) {
      assert.equal(new Set(circuit.stories.map((scene) => scene.narrative[locale])).size, 5, id + ':' + locale);
    }
  }
});
