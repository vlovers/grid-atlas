import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const a = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/DALLAS_DETROIT_1982_1984_23_HISTORICAL_SECTIONS_20261102.json',import.meta.url),'utf8'));
const b = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/PESCARA_PORTO_CAESARS_19_HISTORIC_ROUTE_SCENES_20261102.json',import.meta.url),'utf8'));

test('five historic route reconstructions preserve 42 bilingual landmarks without invented FIA numbering',()=>{
  assert.equal(a.historical_layouts.length+b.layouts.length,5);
  assert.equal(a.historical_layouts.reduce((s,g)=>s+g.landmarks.length,0)+b.layouts.reduce((s,g)=>s+g.landmarks.length,0),42);
  for(const g of b.layouts) {
    assert.ok(g.years.length>=1);
    assert.equal(g.corner_numbering_status,'not_reconciled');
    assert.deepEqual(g.landmarks.map(x=>x.reading_order),Array.from({length:g.landmarks.length},(_,i)=>i+1));
    for(const x of g.landmarks){
      assert.equal(x.official_turn_numbers,null);
      assert.equal(x.review_status,'pending');
      assert.ok(x.body.en.trim().split(/\s+/).length>=28, g.circuit_id+':'+x.reading_order+':en');
      assert.ok(x.body.uk.trim().split(/\s+/).length>=25, g.circuit_id+':'+x.reading_order+':uk');
      assert.ok(x.source_urls.every(url=>/^https:\/\//.test(url)));
    }
  }
  assert.equal(a.publication_authorized,false);
  assert.equal(b.publication_authorized,false);
  assert.match(b.media_license,/No source maps/);
});