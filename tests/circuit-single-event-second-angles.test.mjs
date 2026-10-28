import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const body = readFileSync(new URL('TEN_SINGLE_EVENT_SECOND_ANGLES_20261028.md',root),'utf8');
const ledger = JSON.parse(readFileSync(new URL('CIRCUIT_33_CANONICAL_STORY_INDEX.json',root),'utf8'));
const ids=['ain-diab','avus','bugatti','dallas','madring','monsanto','pescara','riverside','sebring','zeltweg'];
test('ten second-angle dossiers are bilingual and never counted as new races',()=>{
 const chapters=body.split(/^## \d+\. /m).slice(1);
 assert.equal(chapters.length,10);
 chapters.forEach((chapter,i)=>{
  assert.ok(chapter.startsWith(ids[i]+' — second angle'));
  assert.match(chapter,/^### EN — /m);
  assert.match(chapter,/^### UK — /m);
  assert.match(chapter,/not an additional race/);
  assert.match(chapter,/rights approval pending/);
  assert.ok(chapter.length>850);
  assert.equal(ledger.entries.filter(x=>x.circuit_id===ids[i]&&x.event_year!==null).length,1);
 });
});
