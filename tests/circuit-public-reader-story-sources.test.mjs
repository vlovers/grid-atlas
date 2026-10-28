import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stories=JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-final33-stories.json',import.meta.url),'utf8'));
const sources={
 aida:'https://www.formula1.com/en/results/1994/races/606/pacific/race-result',
 reims:'https://www.formula1.com/en/results/1954/races/129/france/race-result',
 rouen:'https://www.formula1.com/en/results/1968/races/260/france/race-result'
};
test('three independently researched circuit cards retain verified event sources and bilingual copy',()=>{
 for(const [id,url] of Object.entries(sources)){
  const story=stories.find(x=>x.id===id);
  assert.ok(story,id+' exists');
  assert.equal(story.source,url);
  for(const locale of ['en','uk']){
   assert.ok(story.title[locale].length>20,id+' '+locale+' title');
   assert.ok(story.description[locale].length>390,id+' '+locale+' narrative');
  }
 }
});
