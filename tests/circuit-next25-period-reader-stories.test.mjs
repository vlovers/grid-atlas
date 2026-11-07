import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/next25-research-leads.json', import.meta.url), 'utf8'));

const events = [
  ['brands-hatch', 1964, 'Clark wins at Brands Hatch', 'Graham Hill', 'Ґрем Гілл', 'motorsportmagazine.com/archive/article/august-1964/58/'],
  ['watkins-glen', 1961, 'A memorable first winner at the Glen', '4.3 seconds', '4,3 секунди', 'grandprix.com/races/united-states-gp-1961.html'],
  ['kyalami', 1967, 'A first Kyalami winner', 'John Love', 'Джон Лав', 'motorsportmagazine.com/archive/article/february-1967/14/'],
  ['paul-ricard', 1971, "Stewart opens Paul Ricard's F1 history", 'François Cevert', 'Франсуа Севера', 'motorsportmagazine.com/archive/article/august-1971/27/'],
  ['indianapolis', 1950, 'The Indy 500 and the first title season', '138 laps', '138 кіл', 'imsdotcom.azureedge.net/events/indy500/history/rain-delays'],
  ['long-beach', 1976, 'Long Beach arrives in the World Championship', 'Regazzoni', 'Регаццоні', 'motorsportmagazine.com/archive/article/may-1976/52/'],
  ['long-beach', 1977, 'An American winner at Long Beach', 'Andretti', 'Андретті', 'motorsportmagazine.com/archive/article/may-1977/57/'],
];

test('seven 1950–1977 next25 historical stories are substantive bilingual research, not approved copy', () => {
  assert.equal(catalog.circuits.length, 25);
  assert.equal(catalog.status, 'research_only');
  assert.equal(catalog.publication, 'blocked');
  assert.equal(new Set(events.map(([id, year]) => `${id}:${year}`)).size, 7);
  for (const [id, year, title, enAnchor, ukAnchor, independentSource] of events) {
    const circuit = catalog.circuits.find((c) => c.canonical_f1db_id === id);
    assert.ok(circuit, id);
    assert.equal(circuit.publication, 'unpublished');
    const lead = circuit.story_leads.find((s) => s.year === year && s.title.en === title);
    assert.ok(lead, `${id}:${year}`);
    assert.equal(lead.status, 'classification_supported_research_draft');
    assert.equal(lead.source_granularity, 'official_classification_plus_independent_period_narrative_research_review_pending');
    assert.ok(lead.sources.some((url) => url.includes('formula1.com')), `${id}:${year} official source`);
    assert.ok(lead.sources.some((url) => url.includes(independentSource)), `${id}:${year} independent source`);
    assert.equal(new Set(lead.sources).size, lead.sources.length, `${id}:${year} duplicate sources`);
    assert.ok(lead.narrative.en.length > 600, `${id}:${year} English depth`);
    assert.ok(lead.narrative.uk.length > 600, `${id}:${year} Ukrainian depth`);
    assert.ok(lead.narrative.en.includes(enAnchor), `${id}:${year} English claim`);
    assert.ok(lead.narrative.uk.includes(ukAnchor), `${id}:${year} Ukrainian claim`);
    assert.match(lead.research_note, /independent human review/);
  }
});

test('Indy oval and historic Grand Prix layouts are not conflated with modern circuits', () => {
  const indy = catalog.circuits.find((c) => c.canonical_f1db_id === 'indianapolis');
  const indyStory = indy.story_leads.find((s) => s.year === 1950);
  assert.match(indyStory.narrative.en, /oval race/);
  assert.match(indyStory.narrative.uk, /овалі/);
  const paul = catalog.circuits.find((c) => c.canonical_f1db_id === 'paul-ricard');
  assert.match(paul.story_leads.find((s) => s.year === 1971).narrative.en, /original long circuit/);
});
