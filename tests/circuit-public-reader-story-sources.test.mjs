import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stories=JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-final33-stories.json',import.meta.url),'utf8'));
const sources={
 aida:'https://github.com/f1db/f1db/blob/v2026.17.0/src/data/seasons/1994/races/02-pacific/race-results.yml',
 reims:'https://github.com/f1db/f1db/blob/v2026.17.0/src/data/seasons/1954/races/04-france/race-results.yml',
 rouen:'https://github.com/f1db/f1db/blob/v2026.17.0/src/data/seasons/1968/races/06-france/race-results.yml'
};
test('three independently researched circuit cards retain pinned F1DB race sources and bilingual copy',()=>{
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
