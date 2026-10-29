import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const md=readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_FIVE_SINGLE_SOURCE_CLAIM_DECISIONS_20261029.md',import.meta.url),'utf8');
const ids=['anderstorp','bremgarten','buenos-aires','clermont-ferrand','dijon'];
test('25 claim-level evidence decisions cover five single-source circuit dossiers without approvals',()=>{
 const records=[...md.matchAll(/^### ([a-z-]+):([1-5]) — (.+)$/gm)];
 assert.equal(records.length,25);
 for(const id of ids){
  assert.deepEqual(records.filter(m=>m[1]===id).map(m=>Number(m[2])),[1,2,3,4,5]);
 }
 assert.equal((md.match(/Evidence status:\*\* \`requires_independent_corroboration\`/g)??[]).length,25);
 assert.equal((md.match(/Targeted next check:/g)??[]).length,25);
 assert.equal((md.match(/Release:\*\* blocked/g)??[]).length,25);
 assert.match(md,/publication_allowed=false/);
 assert.match(md,/No images, approvals, or public application imports/);
});