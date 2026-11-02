import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/SEBRING_1959_TEN_PERIOD_ROUTE_SECTIONS_20261102.json',import.meta.url),'utf8'));
test('1959 Sebring period report is represented by ten bilingual route sections, not invented numbered corners',()=>{
 assert.equal(data.circuit_id,'sebring');assert.equal(data.layout_id,'sebring-1');assert.equal(data.year,1959);
 assert.equal(data.known_f1db_turn_count,17);assert.equal(data.historic_sections.length,10);
 assert.deepEqual(data.historic_sections.map(x=>x.reading_order),Array.from({length:10},(_,i)=>i+1));
 for(const section of data.historic_sections) {
  assert.equal(section.turn_number,null);
  assert.ok(section.body.en.trim().split(/\s+/).length>=25);
  assert.ok(section.body.uk.trim().split(/\s+/).length>=22);
  assert.ok(section.source_urls.some(url=>url.includes('motorsportmagazine.com')));
  assert.ok(section.source_urls.every(url=>url.startsWith('https://')));
  assert.equal(section.review_status,'independent_review_pending');
 }
 assert.equal(data.historical_numbering_verified,false);
 assert.equal(data.publishing_approved,false);
 assert.match(data.explanation,/do not map one-to-one/);
});