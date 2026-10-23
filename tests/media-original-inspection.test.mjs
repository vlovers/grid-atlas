import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { inspectImageBytes, inspectOriginal } from '../scripts/inspect-media-original.mjs';

test('rejects invalid image bytes', () => {
  assert.throws(() => inspectImageBytes(Buffer.alloc(30)), /unsupported/);
});

test('extracts PNG IHDR dimensions', () => {
 const bytes=Buffer.from('89504e470d0a1a0a0000000d494844520000000400000005080200000000000000','hex');
 assert.deepEqual(inspectImageBytes(bytes),{mime:'image/png',width:4,height:5});
});
test('extracts JPEG SOF dimensions', () => {
 const bytes=Buffer.from('ffd8ffe000040000ffc0000b080002000301011100ffd9','hex');
 assert.deepEqual(inspectImageBytes(bytes),{mime:'image/jpeg',width:3,height:2});
});

test('hashes local original while leaving approval unresolved', () => {
 const dir=mkdtempSync(join(tmpdir(),'ga-image-'));
 try {
  const filePath=join(dir,'original.jpg');
  const bytes=Buffer.from('ffd8ffe000040000ffc0000b080002000301011100ffd9','hex');
  writeFileSync(filePath,bytes);
  const sha=createHash('sha256').update(bytes).digest('hex');
  const staging={lane:'research_only',publication_allowed:false,entries:[{id:'research-test',file_page_url:'https://commons.wikimedia.org/wiki/File:Test.jpg',image:{mime:'image/jpeg'}}]};
  const result=inspectOriginal({filePath,researchId:'research-test',staging,expectedSha256:sha});
  assert.equal(result.local_original.sha256,sha);
  assert.equal(result.publication_allowed,false);
  assert.equal(result.unresolved.independent_human_review,true);
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging,expectedSha256:'0'.repeat(64)}),/does not match/);
 } finally { rmSync(dir,{recursive:true,force:true}); }
});
