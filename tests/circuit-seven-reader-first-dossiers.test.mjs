import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const md=readFileSync(new URL('../docs/editorial/circuit-experience-v3/SEVEN_MORE_READER_FIRST_DOSSIERS_20261028.md',import.meta.url),'utf8');
test('seven underrepresented circuit chapters are bilingual, sourced and blocked',()=>{
 const ids=[...md.matchAll(/^## ([a-z][a-z0-9-]+) \(\d{4}\)$/gm)].map(x=>x[1]);
 assert.deepEqual(ids,['bremgarten','buenos-aires','jarama','zolder','aida','reims','rouen']);
 for(const section of md.split(/^## [a-z][a-z0-9-]+ \(\d{4}\)$/m).slice(1)){
  assert.match(section,/### EN — /);assert.match(section,/### UK — /);
  assert.match(section,/https:\/\/(github\.com|www\.formula1\.com)\//);
  assert.match(section,/Publication allowed:\*\* false/);
 }
});