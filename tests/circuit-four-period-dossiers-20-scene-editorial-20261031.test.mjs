import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const document = JSON.parse(
  readFileSync(
    new URL('../docs/editorial/circuit-experience-v3/EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json', import.meta.url),
    'utf8',
  ),
);

const evidence = {
  'east-london': {
    year: 1962,
    historical: 'grandprix.com/races/south-african-gp-1962',
    en: ['first drivers', 'locking washer', 'half a second', '3.5 seconds', 'Neville Lederle'],
    uk: ['перший титул', 'стопорну шайбу', 'пів секунди', '3,5 секунди', 'Невілла Ледерле'],
  },
  jarama: {
    year: 1981,
    historical: 'archive/article/august-1981/102/spanish-grand-prix-8',
    en: ['turbocharged V6', 'clutch dragged', 'Laffite attacked Reutemann', 'third gear', '1.240 seconds'],
    uk: ['турбований V6', 'зчеплення його', 'Лаффіт атакував Ройтеманна', 'третьою передачею', '1,240 секунди'],
  },
  jerez: {
    year: 1986,
    historical: 'grandprix.com/races/spanish-gp-1986',
    en: ['0.014 seconds', 'fresh tyres', 'Prost slipped into second', 'a lap behind', 'engine overheating'],
    uk: ['0,014 секунди', 'свіжі шини', 'вийшов другим', 'програвши Сенні коло', 'перегрів двигуна'],
  },
  monaco: {
    year: 1996,
    historical: 'grandprix.com/races/monaco-gp-1996',
    en: ['14th', 'switch to slicks', 'Only three cars', 'Saturday', 'Jean Alesi'],
    uk: ['14-м', 'перехід на сліки', 'лише три машини', 'суботнім поулом', 'Жана Алезі'],
  },
};

test('20 period-linked scenes keep distinct bilingual race turning points and fail-closed review', () => {
  let total = 0;
  for (const [id, expected] of Object.entries(evidence)) {
    const circuit = document.circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((story) => story.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(circuit.stories.map((story) => story.narrative.en)).size, 5, id);
    assert.equal(new Set(circuit.stories.map((story) => story.narrative.uk)).size, 5, id);
    for (const [index, story] of circuit.stories.entries()) {
      total++;
      assert.equal(story.year, expected.year);
      assert.ok(story.narrative.en.length >= 200, id + ':en:' + index);
      assert.ok(story.narrative.uk.length >= 200, id + ':uk:' + index);
      assert.ok(story.narrative.en.includes(expected.en[index]), id + ':en anchor:' + index);
      assert.ok(story.narrative.uk.includes(expected.uk[index]), id + ':uk anchor:' + index);
      assert.ok(story.source_urls.every((url) => url.includes('formula1.com/')), id + ':classification');
      assert.ok(story.historical_sources.length >= 2, id + ':narrative sources');
      assert.ok(story.historical_sources.some((url) => url.includes(expected.historical)), id + ':specific period evidence');
      assert.ok(story.historical_sources.every((url) => !story.source_urls.includes(url)), id + ':source distinction');
      assert.match(story.historical_source_locator, /classification only.*independent review pending/i);
      assert.equal(story.historical_review_status, 'pending_independent_claim_review');
      assert.equal(story.independent_approval, false);
      assert.equal(story.publication, 'blocked');
    }
  }
  assert.equal(total, 20);
  assert.equal(document.publication, 'blocked');
});
