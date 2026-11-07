import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/DALLAS_DETROIT_1982_1984_23_HISTORICAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
test('historic Dallas and Detroit reading routes preserve 1984 and 1982 context', () => {
  assert.equal(data.historical_layouts.length, 2);
  assert.deepEqual(data.historical_layouts.map(x=>[x.circuit_id,x.year,x.archive_recorded_turns,x.landmarks.length]),[['dallas',1984,23,13],['detroit',1982,24,10]]);
  for (const guide of data.historical_layouts) {
    assert.equal(guide.numbered_scheme_status,'unreconciled_historical_count');
    assert.deepEqual(guide.landmarks.map(x=>x.reading_order), Array.from({length: guide.landmarks.length},(_,i)=>i+1));
    for (const item of guide.landmarks) {
      assert.equal(item.official_turn_numbers, null);
      assert.equal(item.review_status,'pending');
      assert.ok(item.explanation.en.trim().split(/\s+/).length>=31);
      assert.ok(item.explanation.uk.trim().split(/\s+/).length>=28);
      assert.ok(item.source_urls.every(u=>u.startsWith('https://')));
    }
  }
});
test('research route reconstruction cannot be presented as 23/24 individually approved turns', () => {
  assert.equal(data.publication_authorized,false);
  assert.equal(data.publication_status,'unreviewed_research_only');
  assert.match(data.media_status,/no images or map assets copied/);
  assert.ok(data.historical_layouts.every(g=>g.landmarks.length<g.archive_recorded_turns));
});
