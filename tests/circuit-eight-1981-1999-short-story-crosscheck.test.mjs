import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const evidence=read('docs/editorial/circuit-experience-v3/EIGHT_1981_1999_SHORT_STORY_CROSSCHECK_20261030.json');
const stories=[...read('apps/web/src/components/editorial/circuit-next20-stories.json'),...read('apps/web/src/components/editorial/circuit-extra-stories.json')];
test('eight EN/UK 1981–1999 circuit stories retain research-only provenance',()=>{
 assert.equal(evidence.entries.length,8);
 assert.equal(new Set(evidence.entries.map(x=>x.circuit_id)).size,8);
 assert.equal(evidence.independent_human_approval,false);
 assert.equal(evidence.publication_allowed,false);
 for(const entry of evidence.entries){
  const story=stories.find(x=>x.id===entry.circuit_id);
  assert.ok(story,entry.circuit_id);
  assert.ok(story.source.startsWith('https://'));
  assert.ok(entry.independent_source_url.startsWith('https://www.motorsportmagazine.com/'));
  assert.equal(entry.review_status,'research_crosscheck_only');
  assert.equal(entry.independent_human_approval,false);
  assert.equal(entry.publication_allowed,false);
  for(const locale of ['en','uk']){
   assert.ok(story.title[locale].length>15,entry.circuit_id+' '+locale);
   assert.ok(story.description[locale].length>200,entry.circuit_id+' '+locale);
  }
 }
});
