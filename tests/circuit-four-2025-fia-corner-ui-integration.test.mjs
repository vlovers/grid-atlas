import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const corners = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));
const manuscript = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/NUMBERED_CORNER_GUIDES_AUSTIN_BAHRAIN_20261102.json', import.meta.url), 'utf8'));
const expected = { silverstone: 18, monza: 11, austin: 20, bahrain: 15, suzuka: 18, interlagos: 15, hungaroring: 14, zandvoort: 14, baku: 20, melbourne: 14, 'mexico-city': 17 };

test('eleven 2025 FIA-mapped circuits expose every individual turn in the gated candidate model', () => {
  assert.deepEqual(corners.guides.map(x => x.circuit_id).sort(), Object.keys(expected).sort());
  for (const guide of corners.guides) {
    const numbers = guide.sections.flatMap(s => s.numbers).sort((a,b) => a-b);
    assert.deepEqual(numbers, Array.from({length:expected[guide.circuit_id]}, (_,i) => i+1), guide.circuit_id);
    assert.equal(guide.numbering_year, 2025);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.match(corners.sources[guide.circuit_id+'-map'], /^https:\/\/www\.fia\.com\//);
    assert.match(corners.sources[guide.circuit_id+'-names'], /^https:\/\//);
    for (const section of guide.sections) {
      assert.ok(section.explanation?.en?.trim(), guide.circuit_id+':'+section.id+':en');
      assert.ok(section.explanation.en.trim().split(/\s+/).length >= 22, guide.circuit_id+':'+section.id+':en-short');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 18, guide.circuit_id+':'+section.id+':uk-short');
      assert.ok(section.explanation?.uk?.trim(), guide.circuit_id+':'+section.id+':uk');
      assert.equal(section.confirmation_status, 'source_checked_ai');
      assert.deepEqual(section.sources, [guide.circuit_id+'-map',guide.circuit_id+'-names']);
    }
  }
});

test('Silverstone and Monza have distinct numbered narratives with period-aware named complexes', () => {
  for (const id of ['silverstone','monza']) {
    const guide = corners.guides.find(g => g.circuit_id === id);
    assert.equal(guide.sections.length, expected[id]);
    assert.ok(guide.sections.every(section => section.numbers.length === 1));
    assert.equal(new Set(guide.sections.map(section => section.explanation.en)).size, expected[id]);
    assert.equal(new Set(guide.sections.map(section => section.explanation.uk)).size, expected[id]);
  }
  const silverstone = corners.guides.find(g => g.circuit_id === 'silverstone');
  assert.ok(silverstone.sections.filter(s => s.name === 'Maggotts–Becketts–Chapel').length === 5);
  assert.ok(silverstone.sections.filter(s => s.name === 'Club').length === 2);
  const monza = corners.guides.find(g => g.circuit_id === 'monza');
  assert.ok(monza.sections.filter(s => s.name === 'Variante Ascari').length === 3);
});

test('Suzuka has 18 separately authored numbered sections and no fabricated T10 name', () => {
  const suzuka = corners.guides.find(g => g.circuit_id === 'suzuka');
  assert.equal(suzuka.sections.length, 18);
  assert.equal(suzuka.layout_id, 'suzuka-2');
  assert.equal(suzuka.sections[9].name, null);
  assert.equal(suzuka.sections[14].name, '130R');
  assert.equal(suzuka.sections[15].name, 'Casio Triangle');
  assert.ok(suzuka.sections.every(s => s.numbers.length === 1));
});

test('Interlagos has 15 individually sourced bends and no invented names for its final uphill sweep', () => {
  const interlagos = corners.guides.find(g => g.circuit_id === 'interlagos');
  assert.equal(interlagos.layout_id, 'interlagos-2');
  assert.equal(interlagos.sections.length, 15);
  assert.equal(interlagos.sections[9].name, 'Bico de Pato');
  assert.equal(interlagos.sections[11].name, 'Junção');
  assert.equal(interlagos.sections[13].name, null);
  assert.equal(interlagos.sections[14].name, null);
  assert.match(corners.sources['interlagos-names'], /f1sp_2025_media_kit/);
});

test('Austin/Bahrain research is actually mapped into candidate UI, without invented named corners', () => {
  for (const source of manuscript.guides) {
    const guide = corners.guides.find(g => g.circuit_id === source.circuit_id);
    assert.equal(guide.layout_id, source.circuit_id+'-1');
    for (const turn of source.turns) {
      const section = guide.sections.find(s => s.numbers.includes(turn.number));
      assert.ok(section, source.circuit_id+':'+turn.number);
      if (source.circuit_id === 'bahrain' && turn.number === 1) {
        assert.equal(section.name, 'Michael Schumacher Corner');
        assert.match(section.explanation.en, /2014/);
      } else {
        assert.equal(section.name, null, source.circuit_id+':'+turn.number);
        assert.deepEqual(section.explanation, turn.explanation);
      }
    }
  }
  assert.equal(manuscript.publication_authorized, false);
});
