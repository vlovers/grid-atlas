import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { commonsFileTitle, ingestCommonsOriginal } from '../scripts/ingest-commons-original.mjs';

function crc32(bytes) {
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function chunk(name,bytes) {
 const type=Buffer.from(name),size=Buffer.alloc(4),checksum=Buffer.alloc(4);
 size.writeUInt32BE(bytes.length);checksum.writeUInt32BE(crc32(Buffer.concat([type,bytes])));
 return Buffer.concat([size,type,bytes,checksum]);
}
function png() {
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(4,0);ihdr.writeUInt32BE(5,4);ihdr[8]=8;ihdr[9]=2;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.alloc(5*(1+4*3)))),chunk('IEND',Buffer.alloc(0))]);
}
const id='research-test';
const filePage='https://commons.wikimedia.org/wiki/File:Test.png';
const originalUrl='https://upload.wikimedia.org/wikipedia/commons/a/ab/Test.png';
function fixtures(bytes=png()) {
 const staging={lane:'research_only',publication_allowed:false,entries:[{id,file_page_url:filePage,status:'candidate',review:null,delivery:{local_path:null,remote_url:null},image:{mime:'image/png',width:null,height:null}}]};
 const sourceEvidence={lane:'research_only',publication_allowed:false,entries:[{research_id:id,file_page_url:filePage,sha1:createHash('sha1').update(bytes).digest('hex'),bytes:bytes.length,width:4,height:5,description_oldid:1}]};
 return {staging,sourceEvidence};
}
function mockFetch(bytes, { url=originalUrl, size=bytes.length, responseBytes=bytes, redirect=false }={}) {
 const calls=[];
 const fetchImpl=async (input,options)=>{
  calls.push({input,options});
  if(input.startsWith('https://commons.wikimedia.org/w/api.php')) {
   return new Response(JSON.stringify({query:{pages:[{title:'File:Test.png',imageinfo:[{url,size,width:4,height:5,timestamp:'2026-10-23T00:00:00Z'}]}]}}),{status:200,headers:{'content-type':'application/json'}});
  }
  if(redirect) return new Response(null,{status:302,headers:{location:'https://example.com/evil'}});
  return new Response(responseBytes,{status:200,headers:{'content-length':String(responseBytes.length)}});
 };
 return {fetchImpl,calls};
}
test('accepts only canonical Commons file pages',()=>{
 assert.equal(commonsFileTitle(filePage),'File:Test.png');
 for(const url of ['http://commons.wikimedia.org/wiki/File:Test.png','https://evil.example/wiki/File:Test.png','https://commons.wikimedia.org/wiki/File:Test.png?download=1','https://commons.wikimedia.org/wiki/File:../Test.png','https://commons.wikimedia.org/wiki/File:Test.png#fragment']) assert.throws(()=>commonsFileTitle(url));
});
test('downloads exact pinned original, verifies SHA-256 and SHA-1, and never publishes',async()=>{
 const bytes=png(),dir=mkdtempSync(join(tmpdir(),'grid-atlas-commons-'));
 try{
  const mock=mockFetch(bytes);
  const report=await ingestCommonsOriginal({researchId:id,outputDir:dir,...fixtures(bytes),fetchImpl:mock.fetchImpl});
  assert.equal(report.publication_allowed,false);
  assert.equal(report.local_original.sha256,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(report.source_evidence.matched,true);
  assert.deepEqual(readFileSync(report.local_original.path),bytes);
  assert.equal(mock.calls.length,2);
  assert.ok(mock.calls.every(call=>call.options.redirect==='manual'));
  assert.ok(mock.calls[0].input.includes('titles=File%3ATest.png'));
  assert.ok(report.unresolved.independent_human_review);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('rejects modified bytes and leaves no original behind',async()=>{
 const bytes=png(),dir=mkdtempSync(join(tmpdir(),'grid-atlas-commons-'));
 try{
  const modified=Buffer.from(bytes);modified[modified.length-1]^=1;
  const mock=mockFetch(bytes,{responseBytes:modified});
  await assert.rejects(()=>ingestCommonsOriginal({researchId:id,outputDir:dir,...fixtures(bytes),fetchImpl:mock.fetchImpl}),/CRC mismatch|SHA-1|IEND/);
  assert.equal(existsSync(join(dir,id+'.png')),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('rejects unexpected origin, metadata changes and redirects',async()=>{
 const bytes=png(),dir=mkdtempSync(join(tmpdir(),'grid-atlas-commons-'));
 try{
  for(const opts of [{url:'https://example.com/Test.png'},{size:bytes.length+1},{redirect:true}]) {
   const mock=mockFetch(bytes,opts);
   await assert.rejects(()=>ingestCommonsOriginal({researchId:id,outputDir:dir,...fixtures(bytes),fetchImpl:mock.fetchImpl}));
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('does not overwrite existing originals or follow output-directory symlinks',async()=>{
 const bytes=png(),dir=mkdtempSync(join(tmpdir(),'grid-atlas-commons-'));
 try{
  const path=join(dir,id+'.png');writeFileSync(path,Buffer.from('do not overwrite'));
  await assert.rejects(()=>ingestCommonsOriginal({researchId:id,outputDir:dir,...fixtures(bytes),fetchImpl:mockFetch(bytes).fetchImpl}),/EEXIST/);
  assert.equal(readFileSync(path,'utf8'),'do not overwrite');
  const link=join(dir,'linked');symlinkSync(dir,link);
  await assert.rejects(()=>ingestCommonsOriginal({researchId:id,outputDir:link,...fixtures(bytes),fetchImpl:mockFetch(bytes).fetchImpl}),/symlink/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
