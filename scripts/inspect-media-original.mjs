import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 40 * 1024 * 1024;
const jpgSOF = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);


const MAX_PIXELS = 80_000_000;
const PNG_SIGNATURE = Buffer.from([137,80,78,71,13,10,26,10]);
function dimensions(width,height) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>MAX_PIXELS) throw Error('Invalid image dimensions or pixel limit exceeded');
  return {width,height};
}
function crc32(bytes,start,end) {
  let crc=0xffffffff;
  for(let i=start;i<end;i++){
    crc^=bytes[i];
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function inspectPng(bytes){
  let pos=8,chunkCount=0,width,height,sawIHDR=false,sawIDAT=false,sawIEND=false;
  while(pos<bytes.length){
    if(bytes.length-pos<12)throw Error('Truncated PNG chunk');
    const length=bytes.readUInt32BE(pos),end=pos+12+length;
    if(length>MAX_BYTES||end>bytes.length)throw Error('Truncated or oversized PNG chunk');
    const type=bytes.toString('ascii',pos+4,pos+8);
    if(!/^[A-Za-z]{4}$/.test(type))throw Error('Invalid PNG chunk type');
    if(crc32(bytes,pos+4,end-4)!==bytes.readUInt32BE(end-4))throw Error('PNG CRC mismatch');
    if(++chunkCount>100000)throw Error('Too many PNG chunks');
    if(!sawIHDR){
      if(type!=='IHDR'||length!==13)throw Error('Invalid PNG IHDR');
      width=bytes.readUInt32BE(pos+8);height=bytes.readUInt32BE(pos+12);
      dimensions(width,height);
      const depth=bytes[pos+16],color=bytes[pos+17];
      const legal={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
      if(!legal[color]?.includes(depth)||bytes[pos+18]!==0||bytes[pos+19]!==0||![0,1].includes(bytes[pos+20]))throw Error('Invalid PNG IHDR encoding');
      sawIHDR=true;
    }else if(type==='IHDR')throw Error('Duplicate PNG IHDR');
    if(type==='IDAT')sawIDAT=true;
    if(type==='IEND'){
      if(length!==0||!sawIDAT||end!==bytes.length)throw Error('Invalid PNG IEND or trailing data');
      sawIEND=true;break;
    }
    pos=end;
  }
  if(!sawIEND)throw Error('PNG missing IEND');
  return {mime:'image/png',width,height};
}
function inspectJpeg(bytes){
  let pos=2,width,height,sawSOS=false,sawEOI=false,markerCount=0;
  while(pos<bytes.length){
    if(bytes[pos]!==0xff)throw Error('Invalid JPEG marker boundary');
    while(bytes[pos]===0xff)pos++;
    if(pos>=bytes.length)throw Error('Truncated JPEG marker');
    const marker=bytes[pos++];
    if(++markerCount>100000)throw Error('Too many JPEG markers');
    if(marker===0xd9){sawEOI=true;break;}
    if(marker===0x00)throw Error('Unexpected JPEG byte stuffing');
    if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
    if(pos+2>bytes.length)throw Error('Truncated JPEG segment length');
    const size=bytes.readUInt16BE(pos);
    if(size<2||pos+size>bytes.length)throw Error('Truncated JPEG segment');
    if(jpgSOF.has(marker)){
      if(size<8||width!==undefined)throw Error('Invalid or duplicate JPEG SOF');
      height=bytes.readUInt16BE(pos+3);width=bytes.readUInt16BE(pos+5);dimensions(width,height);
    }
    if(marker===0xda){
      if(width===undefined)throw Error('JPEG SOS precedes SOF');
      sawSOS=true;pos+=size;
      while(pos<bytes.length){
        if(bytes[pos++]!==0xff)continue;
        if(pos>=bytes.length)throw Error('Truncated JPEG scan');
        const next=bytes[pos++];
        if(next===0x00||(next>=0xd0&&next<=0xd7))continue;
        if(next===0xd9){sawEOI=true;break;}
        pos-=2;break;
      }
      if(sawEOI)break;
      continue;
    }
    pos+=size;
  }
  if(width===undefined||!sawSOS||!sawEOI||pos!==bytes.length)throw Error('JPEG missing SOF, SOS or EOI or has trailing bytes');
  return {mime:'image/jpeg',width,height};
}
/** Structural inspection only; never a full decode, malware scan or license approval. */
export function inspectImageBytes(buffer) {
  if(!Buffer.isBuffer(buffer)||buffer.length<16||buffer.length>MAX_BYTES)throw Error('Truncated or oversized image');
  if(buffer.subarray(0,8).equals(PNG_SIGNATURE))return inspectPng(buffer);
  if(buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return inspectJpeg(buffer);
  throw Error('Only JPEG and PNG original files are supported');
}

export function inspectOriginal({filePath,researchId,staging,expectedSha256,expectedSha1,expectedBytes,sourceEvidence}) {
  if(staging?.schema_version!==1||staging.lane!=='research_only'||staging.publication_allowed!==false||!Array.isArray(staging.entries))throw Error('Invalid research-only staging manifest');
  const matches=staging.entries.filter(e=>e.id===researchId);
  if(matches.length!==1)throw Error('Unknown or duplicate research ID');
  const entry=matches[0];
  if(entry.status!=='candidate'||entry.review!==null||entry.delivery?.local_path!==null||entry.delivery?.remote_url!==null)throw Error('Research entry must remain unpublished and unapproved');
  if(!['image/jpeg','image/png'].includes(entry.image?.mime)) throw Error('Staged image MIME is unsupported');
  if(typeof filePath!=='string'||!filePath)throw Error('Missing original file path');
  const absolute=resolve(filePath);
  const stat=lstatSync(absolute);
  if(!stat.isFile() || stat.isSymbolicLink() || stat.size>MAX_BYTES || stat.size<16) throw Error('Original must be a regular file of 16 bytes to 40 MiB');
  const bytes=readFileSync(absolute);
  if(bytes.length!==stat.size)throw Error('Original changed during inspection');
  if(expectedBytes!==undefined&&(!Number.isSafeInteger(expectedBytes)||expectedBytes<1||bytes.length!==expectedBytes))throw Error('Original byte count does not match source evidence');
  const decoded=inspectImageBytes(bytes);
  if(decoded.mime!==entry.image.mime) throw Error('Original signature does not match staged MIME');
  if(entry.image.width!==null&&entry.image.width!==decoded.width)throw Error('Original width does not match staged dimensions');
  if(entry.image.height!==null&&entry.image.height!==decoded.height)throw Error('Original height does not match staged dimensions');
  const evidenceMatches=sourceEvidence?.entries?.filter(e=>e.research_id===researchId)??[];
  if(sourceEvidence && (sourceEvidence.schema_version!==1||sourceEvidence.lane!=='research_only'||sourceEvidence.publication_allowed!==false||!Array.isArray(sourceEvidence.entries)||evidenceMatches.length>1))throw Error('Invalid or ambiguous Commons source evidence');
  const evidence=evidenceMatches[0];
  if(evidence){
    if(evidence.file_page_url!==entry.file_page_url||!Number.isSafeInteger(evidence.description_oldid)||evidence.description_oldid<1)throw Error('Commons source evidence page mismatch');
    if(!/^[a-f0-9]{40}$/.test(evidence.sha1)||!Number.isSafeInteger(evidence.bytes)||evidence.bytes<1||!Number.isSafeInteger(evidence.width)||!Number.isSafeInteger(evidence.height))throw Error('Invalid Commons source evidence fields');
    if(bytes.length!==evidence.bytes||decoded.width!==evidence.width||decoded.height!==evidence.height)throw Error('Original does not match Commons source evidence dimensions or byte count');
  }
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const sha1=createHash('sha1').update(bytes).digest('hex');
  if(evidence&&sha1!==evidence.sha1)throw Error('Original SHA-1 does not match Commons source evidence');
  if(expectedSha1!==undefined&&(!/^[a-f0-9]{40}$/i.test(expectedSha1)||sha1!==expectedSha1.toLowerCase()))throw Error('Original SHA-1 does not match Commons source evidence');
  if(expectedSha256!==undefined && (!/^[a-f0-9]{64}$/i.test(expectedSha256) || sha256!==expectedSha256.toLowerCase())) throw Error('Original SHA-256 does not match supplied expectation');
  return {
    schema_version:1,kind:'local_original_inspection_not_rights_approval',
    research_id:researchId,source_file_page:entry.file_page_url,
    local_original:{sha256,sha1,bytes:bytes.length,mime:decoded.mime,width:decoded.width,height:decoded.height},
    source_evidence:evidence?{matched:true,description_oldid:evidence.description_oldid,original_sha1:evidence.sha1}:null,
    unresolved:{commons_revision:true,creator_license_chain:true,independent_human_review:true,full_image_decode:true},
    publication_allowed:false
  };
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const {values}=parseArgs({options:{file:{type:'string'},id:{type:'string'},'expected-sha256':{type:'string'},'expected-sha1':{type:'string'},'expected-bytes':{type:'string'}}});
    if(!values.file || !values.id) throw Error('Usage: node scripts/inspect-media-original.mjs --id research-id --file /path/to/original.jpg [--expected-sha256 64hex]');
    const staging=JSON.parse(readFileSync(new URL('../docs/media/cross-era-staging.json',import.meta.url),'utf8'));
    const sourceEvidence=JSON.parse(readFileSync(new URL('../docs/media/commons-original-evidence.json',import.meta.url),'utf8'));
    console.log(JSON.stringify(inspectOriginal({filePath:values.file,researchId:values.id,staging,expectedSha256:values['expected-sha256'],expectedSha1:values['expected-sha1'],expectedBytes:values['expected-bytes']===undefined?undefined:Number(values['expected-bytes']),sourceEvidence}),null,2));
  } catch(error) { console.error('Original inspection failed: '+error.message);process.exitCode=1; }
}
