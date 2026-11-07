import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guides = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/NUMBERED_CORNER_GUIDES_AUSTIN_BAHRAIN_20261102.json', import.meta.url), 'utf8'));
const expected = new Map([['austin', 20], ['bahrain', 15]]);

test('Austin and Bahrain have a numbered, individual bilingual entry for every 2025 F1 corner', () => {
  assert.equal(guides.schema_version, 1);
  assert.equal(guides.guides.length, 2);
  for (const guide of guides.guides) {
    const count = expected.get(guide.circuit_id);
    assert.ok(count, guide.circuit_id);
    assert.equal(guide.turns.length, count);
    assert.match(guide.numbering_source_url, /^https:\/\/www\.fia\.com\/system\/files\/decision-document\/2025_/);
    assert.deepEqual(guide.turns.map(x => x.number), Array.from({length: count}, (_,i)=>i+1));
    for (const corner of guide.turns) {
      assert.ok(corner.name.en.trim().length >= 8);
      assert.ok(corner.name.uk.trim().length >= 8);
      assert.ok(corner.explanation.en.trim().split(/\s+/).length >= 27, guide.circuit_id+':'+corner.number+':en');
      assert.ok(corner.explanation.uk.trim().split(/\s+/).length >= 20, guide.circuit_id+':'+corner.number+':uk');
      assert.equal(corner.is_official_named_corner, guide.circuit_id === 'bahrain' && corner.number === 1);
      if (corner.is_official_named_corner) {
        assert.equal(corner.name.en, 'Michael Schumacher Corner');
        assert.match(corner.explanation.en, /2014/);
      }
      assert.ok(corner.source_urls.includes(guide.numbering_source_url));
      assert.equal(corner.publication_status, 'research_pending_independent_review');
    }
  }
});

test('no maps are relicensed and numbered research is not auto-approved for the website', () => {
  assert.equal(guides.publication_authorized, false);
  assert.equal(guides.release_status, 'research_only');
  assert.match(guides.media_license_status, /no_republication/);
  assert.equal(guides.guides.reduce((sum, guide) => sum + guide.turns.length, 0), 35);
});
