import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 40 * 1024 * 1024;
const jpgSOF = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);

/** Decode dimensions from the original file bytes; never trust an extension or HTTP Content-Type. */
export function inspectImageBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) throw Error('Truncated or unsupported image');
  if (buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    if (buffer.length < 33 || buffer.toString('ascii',12,16) !== 'IHDR' || buffer.readUInt32BE(8) !== 13) throw Error('Invalid PNG IHDR');
    const width=buffer.readUInt32BE(16), height=buffer.readUInt32BE(20);
    if (!width || !height || ![0,2,3,4,6].includes(buffer[25])) throw Error('Invalid PNG dimensions or color type');
    return { mime:'image/png',width,height };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let i=2;
    while(i < buffer.length) {
      if(buffer[i] !== 0xff) throw Error('Invalid JPEG marker boundary');
      while(buffer[i] === 0xff) i++;
      if(i >= buffer.length) break;
      const marker=buffer[i++];
      if(marker === 0xd9 || marker === 0xda) break;
      if(marker === 0x01 || (marker>=0xd0 && marker<=0xd7)) continue;
      if(i+2 > buffer.length) break;
      const size=buffer.readUInt16BE(i);
      if(size<2 || i+size>buffer.length) throw Error('Truncated JPEG segment');
      if(jpgSOF.has(marker)) {
        if(size<7) throw Error('Invalid JPEG SOF');
        const height=buffer.readUInt16BE(i+3),width=buffer.readUInt16BE(i+5);
        if(!width || !height) throw Error('Invalid JPEG dimensions');
        return {mime:'image/jpeg',width,height};
      }
      i+=size;
    }
    throw Error('JPEG has no valid SOF segment');
  }
  throw Error('Only JPEG and PNG original files are currently supported');
}

export function inspectOriginal({filePath,researchId,staging,expectedSha256}) {
  const entry=staging?.entries?.find(e=>e.id===researchId);
  if(!entry || staging.lane!=='research_only' || staging.publication_allowed!==false) throw Error('Unknown research ID or invalid staging lane');
  if(!['image/jpeg','image/png'].includes(entry.image?.mime)) throw Error('Staged image MIME is unsupported');
  const absolute=resolve(filePath);
  const stat=lstatSync(absolute);
  if(!stat.isFile() || stat.isSymbolicLink() || stat.size>MAX_BYTES || stat.size<16) throw Error('Original must be a regular file of 16 bytes to 40 MiB');
  const bytes=readFileSync(absolute);
  const decoded=inspectImageBytes(bytes);
  if(decoded.mime!==entry.image.mime) throw Error('Original signature does not match staged MIME');
  const sha256=createHash('sha256').update(bytes).digest('hex');
  if(expectedSha256 && (!/^[a-f0-9]{64}$/i.test(expectedSha256) || sha256!==expectedSha256.toLowerCase())) throw Error('Original SHA-256 does not match supplied expectation');
  return {
    schema_version:1,kind:'local_original_inspection_not_rights_approval',
    research_id:researchId,source_file_page:entry.file_page_url,
    local_original:{sha256,bytes:bytes.length,mime:decoded.mime,width:decoded.width,height:decoded.height},
    unresolved:{commons_revision:true,creator_license_chain:true,independent_human_review:true},
    publication_allowed:false
  };
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const {values}=parseArgs({options:{file:{type:'string'},id:{type:'string'},'expected-sha256':{type:'string'}}});
    if(!values.file || !values.id) throw Error('Usage: node scripts/inspect-media-original.mjs --id research-id --file /path/to/original.jpg [--expected-sha256 64hex]');
    const staging=JSON.parse(readFileSync(new URL('../docs/media/cross-era-staging.json',import.meta.url),'utf8'));
    console.log(JSON.stringify(inspectOriginal({filePath:values.file,researchId:values.id,staging,expectedSha256:values['expected-sha256']}),null,2));
  } catch(error) { console.error('Original inspection failed: '+error.message);process.exitCode=1; }
}
