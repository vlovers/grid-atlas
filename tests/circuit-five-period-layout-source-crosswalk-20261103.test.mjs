import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const research = JSON.parse(readFileSync(new URL(
  '../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json',
  import.meta.url,
), 'utf8'));

const periodLayouts = new Map([
  ['clermont-ferrand', { count: 6, url: 'https://www.racingcircuits.info/europe/france/charade.html' }],
  ['dallas', { count: 13, url: 'https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html' }],
  ['detroit', { count: 10, url: 'https://www.racingcircuits.info/north-america/usa/detroit.html' }],
  ['pescara', { count: 7, url: 'https://www.racingcircuits.info/europe/italy/pescara.html' }],
  ['porto', { count: 7, url: 'https://www.statsf1.com/en/circuit-porto.aspx' }],
]);

test('43 bilingual geographic sections link period-specific historical layout evidence, not modern turn maps', () => {
  assert.equal(research.release_authorized, false);
  assert.equal(research.image_rights_approved, false);
  let checked = 0;
  for (const [id, { count, url }] of periodLayouts) {
    const circuit = research.circuits.find(entry => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.equal(circuit.independent_numbering_verified, false, id);
    const geography = circuit.sections.filter(section => section.section_kind === 'route_geography');
    assert.equal(geography.length, count, id);
    for (const section of geography) {
      assert.equal(section.turn_numbers, null, `${id} section ${section.reading_order}`);
      assert.equal(section.provenance_scope.geometric_anchor_verified, false);
      assert.equal(section.provenance_scope.numbered_apex_verified, false);
      assert.ok(section.source_urls.includes(url), `${id}: missing dated layout reference`);
      assert.equal(new Set(section.source_urls).size, section.source_urls.length);
      assert.deepEqual(section.provenance_scope.source_roles.map(role => role.url), section.source_urls);
      assert.equal(
        section.provenance_scope.source_roles.find(role => role.url === url)?.role,
        'historical_layout_reference_not_numbered_fia_map',
      );
      assert.ok(section.description.en.trim().split(/\s+/).length >= 15);
      assert.ok(section.description.uk.trim().split(/\s+/).length >= 12);
      assert.match(section.description.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      checked++;
    }
  }
  assert.equal(checked, 43);
});

test('1984 Dallas and 1982 Detroit references do not silently substitute other configurations', () => {
  const dallas = research.circuits.find(entry => entry.circuit_id === 'dallas');
  const detroit = research.circuits.find(entry => entry.circuit_id === 'detroit');
  assert.equal(dallas.layout_id, 'dallas-1');
  assert.equal(detroit.layout_id, 'detroit-1');
  for (const section of dallas.sections) {
    assert.ok(section.source_urls.every(url => !/f1\.fandom\.com|gdecarli\.it/.test(url)));
  }
  for (const section of detroit.sections) {
    assert.ok(section.source_urls.every(url => !/detroitgp\.com/.test(url)));
  }
  assert.match(dallas.sections[0].description.en, /1988 Trans-Am/);
  assert.match(dallas.sections[7].description.en, /not a numbered corner/);
  assert.match(detroit.sections[1].description.en, /Atwater Street/);
  assert.match(detroit.sections[3].description.en, /1983 Grand Prix/);
});

test('period-specific bilingual context never promotes geographical landmarks to certified corners', () => {
  const expected = [
    ['clermont-ferrand', 5, /1989 short circuit/, /1989 року/],
    ['pescara', 6, /1934/, /1934 році/],
    ['porto', 2, /2005 revival/, /2005 року/],
  ];
  for (const [id, order, en, uk] of expected) {
    const route = research.circuits.find(entry => entry.circuit_id === id);
    const section = route.sections.find(item => item.reading_order === order);
    assert.match(section.description.en, en);
    assert.match(section.description.uk, uk);
    assert.equal(section.turn_numbers, null);
    assert.equal(section.provenance_scope.numbered_apex_verified, false);
  }
  assert.equal(research.circuits.filter(circuit => [
    'ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring',
  ].includes(circuit.circuit_id)).reduce((sum, circuit) => sum + circuit.sections.length, 0), 68);
});
