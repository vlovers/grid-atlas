import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const corners = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));
const manuscript = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/NUMBERED_CORNER_GUIDES_AUSTIN_BAHRAIN_20261102.json', import.meta.url), 'utf8'));
const expected = { silverstone: 18, monza: 11, austin: 20, bahrain: 15 };

test('four 2025 FIA-mapped circuits expose every individual turn in the gated candidate model', () => {
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
      assert.ok(section.explanation?.uk?.trim(), guide.circuit_id+':'+section.id+':uk');
      assert.equal(section.confirmation_status, 'source_checked_ai');
      assert.deepEqual(section.sources, [guide.circuit_id+'-map',guide.circuit_id+'-names']);
    }
  }
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
