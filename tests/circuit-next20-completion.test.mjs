import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => JSON.parse(readFileSync(path,'utf8'));
const data = read('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json');

test('all 20 dossiers preserve bilingual narratives and explicit unpublished state',()=>{
 assert.equal(data.circuits.length,20);
 assert.equal(new Set(data.circuits.map(c=>c.circuit_id)).size,20);
 assert.equal(data.status,'research_only');
 for(const circuit of data.circuits){
  assert.equal(circuit.publication,'unpublished',circuit.circuit_id);
  assert.ok(circuit.moments.length>=3,circuit.circuit_id);
  for(const locale of ['uk','en']){
   assert.ok(circuit.editorial_intro[locale].trim().length>=30,circuit.circuit_id);
  }
  for(const moment of circuit.moments){
   assert.ok(Number.isInteger(moment.year),circuit.circuit_id);
   for(const locale of ['uk','en']){
    assert.ok(moment.title[locale]?.trim().length>5,circuit.circuit_id);
    assert.ok(moment.narrative[locale]?.trim().length>30,circuit.circuit_id);
   }
   assert.ok(Array.isArray(moment.sources),circuit.circuit_id);
   for(const url of moment.sources){
    assert.ok(url.startsWith('https://'),url);
   }
  }
  for(const corner of circuit.corner_names){
   if(corner.turn_number!==null){
    assert.ok(Number.isInteger(corner.turn_number)&&corner.turn_number>0,circuit.circuit_id);
    assert.ok(corner.configuration_id,circuit.circuit_id);
   }
  }
 }
});

test('source links are leads not independent approval',()=>{
 const stories=data.circuits.flatMap(c=>c.moments);
 assert.ok(stories.length>=100);
 assert.ok(stories.some(m=>m.sources.length===0));
 assert.notEqual(data.publication,'published');
});
