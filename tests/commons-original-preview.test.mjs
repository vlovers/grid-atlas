import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import test from 'node:test';

const program = readFileSync('scripts/preview-commons-originals.mjs','utf8');
const evidence = JSON.parse(readFileSync('docs/media/commons-original-evidence.json','utf8'));
test('real photo preview is local research-only and checks pinned original bytes',()=>{
 assert.equal(evidence.lane,'research_only');
 assert.equal(evidence.publication_allowed,false);
 assert.equal(evidence.entries.length,5);
 assert.match(program,/hex\('sha1', bytes\) !== item.sha1/);
 assert.match(program,/bytes.length !== item.bytes/);
 assert.match(program,/hex\('sha256', bytes\) !== observation.sha256/);
 assert.match(program,/--offline/);
 assert.match(program,/research_only: true, publication_allowed: false/);
 assert.match(program,/Rights and editorial review pending/);
 assert.doesNotMatch(program,/apps\/web\/public\/media/);
});
test('offline preview rejects absent originals without any network access',()=>{
 const cwd=mkdtempSync(join(tmpdir(),'grid-atlas-review-'));
 try {
  for (const p of ['scripts/preview-commons-originals.mjs','docs/media/commons-original-evidence.json','docs/media/verified-original-observations.json']){
   const dest=join(cwd,p);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(p));
  }
  const result=spawnSync(process.execPath,[join(cwd,'scripts/preview-commons-originals.mjs'),'--offline'],{cwd,encoding:'utf8'});
  assert.equal(result.status,1);
  assert.match(result.stdout,/Verified originals: 0 \/ 5/);
  const status=JSON.parse(readFileSync(join(cwd,'.grid-atlas/media-review/status.json'),'utf8'));
  assert.equal(status.publication_allowed,false);
  assert.equal(status.entries.every(x=>!x.success),true);
 } finally {rmSync(cwd,{recursive:true,force:true});}
});
