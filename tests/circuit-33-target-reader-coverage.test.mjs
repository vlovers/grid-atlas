import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const base=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const target=JSON.parse(readFileSync(new URL('CIRCUIT_33_STAGING_BUNDLE.json',base),'utf8')).circuits.map(x=>x.circuit_id);
const files=['FIVE_CONTEXTUAL_READER_CHAPTERS_20261028.md','FOUR_CONTRASTING_FINISHES_20261028.md','FOUR_SOURCE_VERIFIED_READER_STORIES_20261028.md','FOUR_HUMAN_RACE_STORIES_20261028.md','FOUR_CHAMPIONSHIP_AND_CHAOS_STORIES_20261028.md','FOUR_HISTORIC_TURNING_POINTS_20261028.md','FOUR_SHORT_CALENDAR_CIRCUITS_20261028.md','SEVEN_MORE_READER_FIRST_DOSSIERS_20261028.md','THREE_FINAL_CIRCUIT_READER_CHAPTERS_20261028.md'];
test('all 33 target circuit identities have at least one new UK/EN reader chapter without publication approval',()=>{
 const found=new Map();
 for(const path of files){
  const text=readFileSync(new URL(path,base),'utf8');
  const parts=text.split(/^## ([a-z][a-z0-9-]+)(?: \(\d{4}\))?$/m).slice(1);
  for(let i=0;i<parts.length;i+=2){
   const id=parts[i], chapter=parts[i+1];
   assert.match(chapter,/### EN — /,path+':'+id);
   assert.match(chapter,/### UK — /,path+':'+id);
   assert.match(chapter,/https:\/\//,path+':'+id);
   assert.match(chapter,/(?:Publication allowed:\*\* false|Publication:\*\* blocked|Status:\*\* unreviewed; not approved for publication)/,path+':'+id);
   found.set(id,(found.get(id)??0)+1);
  }
 }
 assert.deepEqual(target.filter(x=>!found.has(x)),[]);
 assert.equal(found.size,39,'33 target identities plus 6 additional venues');
 assert.equal([...found.values()].reduce((a,b)=>a+b,0),39);
});