import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const body=readFileSync(new URL('MONACO_SPA_TEN_ADDITIONAL_EPISODES_20261028.md',root),'utf8');
const index=JSON.parse(readFileSync(new URL('CIRCUIT_33_CANONICAL_STORY_INDEX.json',root),'utf8'));
const dates=[['monaco',1982],['monaco',1984],['monaco',1996],['monaco',2018],['spa-francorchamps',1992],['spa-francorchamps',1998],['spa-francorchamps',2000],['spa-francorchamps',2019],['spa-francorchamps',2021],['spa-francorchamps',2022]];
test('ten Monaco and Spa narratives are independent indexed bilingual episodes',()=>{
 const chapters=body.split(/^## \d+\. /m).slice(1);
 assert.equal(chapters.length,10);
 chapters.forEach((part,i)=>{
  const [id,year]=dates[i];
  assert.ok(part.startsWith(id+' ('+year+')'));
  assert.match(part,/^### EN — /m);
  assert.match(part,/^### UK — /m);
  assert.ok(part.includes('https://www.formula1.com/en/results/'+year+'/races'));
  assert.match(part,/independent historical review, EN\/UK editing and media review pending/);
  assert.equal(index.entries.filter(x=>x.circuit_id===id&&x.event_year===year).length,1);
 });
});
