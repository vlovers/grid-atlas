import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { inspectImageBytes, inspectOriginal } from '../scripts/inspect-media-original.mjs';

function crc32(bytes) {
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function chunk(name,bytes) {
 const type=Buffer.from(name,'ascii'),size=Buffer.alloc(4),checksum=Buffer.alloc(4);
 size.writeUInt32BE(bytes.length);checksum.writeUInt32BE(crc32(Buffer.concat([type,bytes])));
 return Buffer.concat([size,type,bytes,checksum]);
}
function png(width=4,height=5) {
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
 const rows=Buffer.alloc(height*(1+width*3));
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
const jpeg=()=>Buffer.from('ffd8ffe000040000ffc0000b080002000301011100ffda0008010100003f0000ffd9','hex');
const staging=mime=>({schema_version:1,lane:'research_only',publication_allowed:false,entries:[{
 id:'research-test',file_page_url:'https://commons.wikimedia.org/wiki/File:Test.jpg',
 image:{mime,width:null,height:null},status:'candidate',review:null,delivery:{local_path:null,remote_url:null}
}]});

test('checks PNG CRC, chunk completeness and dimensions',()=>{
 const image=png();
 assert.deepEqual(inspectImageBytes(image),{mime:'image/png',width:4,height:5});
 const corrupt=Buffer.from(image);corrupt[29]^=1;
 assert.throws(()=>inspectImageBytes(corrupt),/CRC mismatch/);
 assert.throws(()=>inspectImageBytes(image.subarray(0,-12)),/IEND/);
 assert.throws(()=>inspectImageBytes(Buffer.concat([image,Buffer.from([0])])),/trailing/);
});
test('rejects oversized pixel count',()=>{
 const bytes=png();bytes.writeUInt32BE(12000,16);bytes.writeUInt32BE(12000,20);
 bytes.writeUInt32BE(crc32(bytes.subarray(12,29)),29);
 assert.throws(()=>inspectImageBytes(bytes),/pixel limit/);
});
test('requires complete JPEG marker stream',()=>{
 assert.deepEqual(inspectImageBytes(jpeg()),{mime:'image/jpeg',width:3,height:2});
 assert.throws(()=>inspectImageBytes(jpeg().subarray(0,-2)),/JPEG missing/);
 assert.throws(()=>inspectImageBytes(Buffer.concat([jpeg(),Buffer.from([0])])),/trailing/);
});
test('rejects random and short bytes',()=>{
 assert.throws(()=>inspectImageBytes(Buffer.alloc(30)),/Only JPEG and PNG/);
 assert.throws(()=>inspectImageBytes(Buffer.alloc(2)),/Truncated/);
});
test('checks SHA-256, MIME, dimensions, symlinks and approval boundaries',()=>{
 const dir=mkdtempSync(join(tmpdir(),'grid-atlas-original-'));
 try{
  const bytes=png(),filePath=join(dir,'original.png');writeFileSync(filePath,bytes);
  const sha=createHash('sha256').update(bytes).digest('hex');
  const sha1=createHash('sha1').update(bytes).digest('hex');
  const evidence={schema_version:1,lane:'research_only',publication_allowed:false,entries:[{
    research_id:'research-test',file_page_url:'https://commons.wikimedia.org/wiki/File:Test.jpg',
    description_oldid:123,sha1,bytes:bytes.length,width:4,height:5
  }]};
  const result=inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),expectedSha256:sha,expectedSha1:sha1,expectedBytes:bytes.length,sourceEvidence:evidence});
  assert.equal(result.local_original.sha256,sha);
  assert.equal(result.local_original.sha1,sha1);
  assert.equal(result.source_evidence.matched,true);
  const mismatch=structuredClone(evidence);mismatch.entries[0].sha1='0'.repeat(40);
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),sourceEvidence:mismatch}),/SHA-1/);
  const badPage=structuredClone(evidence);badPage.entries[0].file_page_url='https://commons.wikimedia.org/wiki/File:Other.jpg';
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),sourceEvidence:badPage}),/page mismatch/);
  const badDimensions=structuredClone(evidence);badDimensions.entries[0].width=99;
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),sourceEvidence:badDimensions}),/source evidence dimensions/);
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),expectedSha1:'0'.repeat(40)}),/SHA-1/);
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),expectedBytes:bytes.length+1}),/byte count/);
  assert.equal(result.publication_allowed,false);
  assert.equal(result.unresolved.full_image_decode,true);
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/png'),expectedSha256:'0'.repeat(64)}),/SHA-256/);
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:staging('image/jpeg')}),/MIME/);
  const wrong=staging('image/png');wrong.entries[0].image.width=100;
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:wrong}),/width/);
  const link=join(dir,'link.png');symlinkSync(filePath,link);
  assert.throws(()=>inspectOriginal({filePath:link,researchId:'research-test',staging:staging('image/png')}),/regular file/);
  const approved=staging('image/png');approved.entries[0].status='verified';
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:approved}),/unpublished/);
  const duplicate=staging('image/png');duplicate.entries.push({...duplicate.entries[0]});
  assert.throws(()=>inspectOriginal({filePath,researchId:'research-test',staging:duplicate}),/duplicate/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
