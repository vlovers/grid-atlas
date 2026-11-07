import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const path = new URL('../docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', import.meta.url);
const catalog = JSON.parse(readFileSync(path, 'utf8'));

const periodEvents = [
  ['silverstone', 1950, 'Farina', 'Фаріна', 'motorsportmagazine.com/archive/article/june-1950/7/'],
  ['silverstone', 1973, 'Scheckter', 'Шектера', 'motorsportmagazine.com/archive/article/july-2023/84/'],
  ['monza', 1967, 'three gallons', 'трьох галонів', 'motorsportmagazine.com/archive/article/october-1967/16/'],
  ['monza', 1971, '0.010', '0,010', 'autosport.com/f1/news/1971-gethin-wins-monza-slipstreamer'],
  ['nurburgring', 1957, '52 seconds', '52 секунди', 'motorsportmagazine.com/archive/article/september-1957/29/'],
  ['nurburgring', 1976, 'Merzario', 'Мерцаріо', 'motorsportmagazine.com/archive/article/september-1976/34/'],
  ['zandvoort', 1961, 'fifteen starters', 'п’ятнадцять машин', 'motorsportmagazine.com/archive/article/july-1961/36/'],
  ['zandvoort', 1973, 'Purley', 'Перлі', 'motorsportmagazine.com/archive/article/september-1973/35/'],
  ['red-bull-ring', 1975, 'lap 19', '19-му колі', 'motorsportmagazine.com/archive/article/september-1975/22/'],
];

test('nine 1950–1976 circuit narratives preserve period sources, bilingual context and publication gates', () => {
  assert.equal(catalog.circuits.length, 20);
  assert.equal(catalog.status, 'research_only');
  assert.equal(catalog.publication, 'blocked_pending_independent_historical_review');
  assert.equal(new Set(periodEvents.map(([id, year]) => `${id}:${year}`)).size, 9);

  for (const [id, year, enAnchor, ukAnchor, sourcePath] of periodEvents) {
    const circuit = catalog.circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.equal(circuit.publication, 'unpublished', id);
    const event = circuit.moments.find((entry) => entry.year === year);
    assert.ok(event, `${id}:${year}`);
    assert.equal(event.review_status, 'source_checked_research_draft');
    assert.ok(event.sources.some((url) => url.includes(sourcePath)), `${id}:${year} period source`);
    assert.ok(event.sources.some((url) => url.includes('formula1.com')), `${id}:${year} classification/official context`);
    assert.equal(new Set(event.sources).size, event.sources.length, `${id}:${year} duplicate sources`);
    assert.ok(event.narrative.en.length > 450, `${id}:${year} English narrative`);
    assert.ok(event.narrative.uk.length > 450, `${id}:${year} Ukrainian narrative`);
    assert.ok(event.narrative.en.includes(enAnchor), `${id}:${year} English event detail`);
    assert.ok(event.narrative.uk.includes(ukAnchor), `${id}:${year} Ukrainian event detail`);
  }
});

test('historical contradictions and layout changes stay explicit research questions', () => {
  const silverstone = catalog.circuits.find((c) => c.circuit_id === 'silverstone');
  const nurburgring = catalog.circuits.find((c) => c.circuit_id === 'nurburgring');
  assert.ok(silverstone.research_gaps.some((gap) => gap.includes('1950 Fangio retirement')));
  assert.ok(nurburgring.research_gaps.some((gap) => gap.includes('1976 Lauda accident')));
  assert.match(nurburgring.moments.find((m) => m.year === 1957).narrative.en, /modern Nürburgring/);
  assert.match(catalog.circuits.find((c) => c.circuit_id === 'red-bull-ring').moments.find((m) => m.year === 1975).narrative.en, /old Österreichring/);
});
