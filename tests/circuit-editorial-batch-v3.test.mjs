import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const dir='docs/editorial/circuit-experience-v3/';
test('two modern circuits have 19 numbered corners and honest provenance',()=>{
  for(const name of ['monaco-turns-and-moments-v1.json','spa-turns-v1.json']){
    const obj=read(dir+name);
    assert.equal(obj.status,'research_only');
    assert.match(obj.configuration_id,/requires_exact_F1DB/);
    assert.equal(obj.turns.length,19);
    assert.deepEqual(obj.turns.map(x=>x.number),Array.from({length:19},(_,i)=>i+1));
    for(const turn of obj.turns){
      for(const locale of ['en','uk']) assert.ok(turn.story[locale]?.trim().length>30,name+' '+turn.number+'/'+locale);
      const sources=turn.sources??turn.source_urls;
      assert.ok(sources?.every(x=>x.startsWith('https://www.formula1.com/')));
    }
  }
});
test('Monaco research separates numbered corners from their shared names and has seven sourced stories',()=>{
  const monaco=read(dir+'monaco-turns-and-moments-v1.json');
  assert.equal(monaco.turns.find(x=>x.number===17).name,null);
  for(const n of [13,14,15,16]) assert.equal(monaco.turns.find(x=>x.number===n).shared_segment,'swimming-pool');
  assert.equal(monaco.moments.length,7);
  for(const item of monaco.moments){
    assert.equal(item.publication,'research_only');
    assert.ok(item.sources?.length>0);
    for(const locale of ['en','uk']){
      assert.ok(item.title[locale].length>5);
      assert.ok(item.narrative[locale].split(/\s+/).length>=40,item.id+'/'+locale);
    }
  }
});
