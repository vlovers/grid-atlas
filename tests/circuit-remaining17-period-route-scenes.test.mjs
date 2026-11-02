import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json',import.meta.url),'utf8'));
const expected = ['ain-diab','bremgarten','bugatti','caesars-palace','clermont-ferrand','dallas','detroit','jacarepagua','monsanto','mont-tremblant','nivelles','pedralbes','pescara','phoenix','porto','riverside','sebring'];

test('remaining 17 circuits have 34 individual period-scoped EN/UK research scenes',()=>{
 assert.equal(data.circuits.length,17);
 assert.deepEqual(data.circuits.map(x=>x.circuit_id),expected);
 assert.equal(data.circuits.reduce((sum,c)=>sum+c.sections.length,0),34);
 for (const circuit of data.circuits){
  assert.ok(circuit.period.length>=4);
  assert.equal(circuit.independent_numbering_verified,false);
  assert.equal(circuit.sections.length,2);
  assert.deepEqual(circuit.sections.map(s=>s.reading_order),[1,2]);
  for(const section of circuit.sections){
   assert.ok(section.label.en.length>=12);
   assert.ok(section.label.uk.length>=12);
   assert.ok(section.description.en.trim().split(/\s+/).length>=29,circuit.circuit_id+':en');
   assert.ok(section.description.uk.trim().split(/\s+/).length>=23,circuit.circuit_id+':uk');
   assert.equal(section.turn_numbers,null);
   assert.equal(section.review_status,'pending');
   assert.ok(section.source_urls.every(url=>url.startsWith('https://')));
  }
 }
});
test('period research is not falsely presented as complete numbered F1 corner guides',()=>{
 assert.equal(data.release_authorized,false);
 assert.equal(data.image_rights_approved,false);
 assert.match(data.coverage_note,/does NOT assert every individual turn/);
});
