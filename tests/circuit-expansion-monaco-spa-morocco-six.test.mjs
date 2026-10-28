import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const body=readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_MONACO_SPA_MOROCCO_SIX_20261028.md',import.meta.url),'utf8');
const events=['monaco — 1961','monaco — 1971','monaco — 1973','spa-francorchamps — 1970','spa-francorchamps — 1961','ain-diab — 1958'];
test('six sourced UK/EN circuit stories preserve the independent review gate',()=>{
 const chapters=body.split(/^## \d+\. /m).slice(1);
 assert.equal(chapters.length,events.length);
 chapters.forEach((chapter,i)=>{
  assert.ok(chapter.startsWith(events[i]));
  assert.match(chapter,/^### EN — /m);
  assert.match(chapter,/^### UK — /m);
  assert.match(chapter,/\*\*Source:\*\* https:\/\/www\.formula1\.com\/en\/results\//);
  assert.match(chapter,/independent factual, language, event-layout and media-rights review pending/);
  assert.ok(chapter.length>700);
 });
});
