import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { inspectPublishedRaster, inspectWebpBytes } from '../scripts/inspect-public-raster.mjs';
import { validateLocalFile } from '../scripts/validate-media-registry.mjs';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(name, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length);
  header.write(name, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), data])));
  return Buffer.concat([header, data, crc]);
}
function png(width = 4, height = 5) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.alloc(height * (1 + width * 3)))),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}
const jpeg = () => Buffer.from('ffd8ffe000040000ffc0000b080002000301011100ffda0008010100003f0000ffd9', 'hex');
function webpChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 'ascii');
  header.writeUInt32LE(data.length, 4);
  return Buffer.concat([header, data, data.length % 2 ? Buffer.from([0]) : Buffer.alloc(0)]);
}
function webp(chunks) {
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write('RIFF');
  header.writeUInt32LE(body.length + 4, 4);
  header.write('WEBP', 8);
  return Buffer.concat([header, body]);
}
function vp8(width = 4, height = 5) {
  const data = Buffer.alloc(10);
  data.set([0x00, 0x00, 0x00, 0x9d, 0x01, 0x2a]);
  data.writeUInt16LE(width, 6);
  data.writeUInt16LE(height, 8);
  return webpChunk('VP8 ', data);
}
function vp8x(width = 4, height = 5, flags = 0) {
  const data = Buffer.alloc(10);
  data[0] = flags;
  data.writeUIntLE(width - 1, 4, 3);
  data.writeUIntLE(height - 1, 7, 3);
  return webpChunk('VP8X', data);
}

test('published JPEG and PNG must be structurally complete and match reviewed dimensions', () => {
  assert.deepEqual(inspectPublishedRaster(png(), { mime: 'image/png', width: 4, height: 5 }), { mime: 'image/png', width: 4, height: 5 });
  assert.deepEqual(inspectPublishedRaster(jpeg(), { mime: 'image/jpeg', width: 3, height: 2 }), { mime: 'image/jpeg', width: 3, height: 2 });
  assert.throws(() => inspectPublishedRaster(png(), { mime: 'image/png', width: 5, height: 5 }), /dimensions/);
  assert.throws(() => inspectPublishedRaster(jpeg(), { mime: 'image/png', width: 3, height: 2 }), /MIME/);
  assert.throws(() => inspectPublishedRaster(png().subarray(0, -12), { mime: 'image/png', width: 4, height: 5 }), /IEND/);
  const damaged = png();
  damaged[29] ^= 1;
  assert.throws(() => inspectPublishedRaster(damaged, { mime: 'image/png', width: 4, height: 5 }), /CRC/);
});

test('published WebP must have a bounded single still frame and consistent canvas', () => {
  const simple = webp([vp8()]);
  assert.deepEqual(inspectWebpBytes(simple), { mime: 'image/webp', width: 4, height: 5 });
  assert.deepEqual(inspectPublishedRaster(simple, { mime: 'image/webp', width: 4, height: 5 }), { mime: 'image/webp', width: 4, height: 5 });
  assert.deepEqual(inspectWebpBytes(webp([vp8x(), vp8()])), { mime: 'image/webp', width: 4, height: 5 });
  assert.throws(() => inspectWebpBytes(webp([vp8x(4, 5, 0x02), vp8()])), /Animated/);
  assert.throws(() => inspectWebpBytes(webp([vp8x(5, 5), vp8()])), /inconsistent/);
  assert.throws(() => inspectWebpBytes(webp([vp8(), vp8()])), /Multiple/);
  assert.throws(() => inspectWebpBytes(webp([vp8()]).subarray(0, -1)), /RIFF/);
  assert.throws(() => inspectWebpBytes(webp([webpChunk('ANIM', Buffer.alloc(6))])), /Unsupported/);
  assert.throws(() => inspectWebpBytes(webp([vp8(14000, 14000)])), /pixel limit/);
  assert.throws(() => inspectPublishedRaster(simple, { mime: 'image/webp', width: 4, height: 6 }), /dimensions/);
});

test('publication preflight rejects an approved checksum with false raster dimensions', t => {
  const root = mkdtempSync(join(tmpdir(), 'grid-atlas-published-raster-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'media'));
  const bytes = png();
  writeFileSync(join(root, 'media', 'photo.png'), bytes);
  const asset = {
    id: 'synthetic-approved-raster',
    status: 'verified',
    delivery: { local_path: '/media/photo.png' },
    content_sha256: createHash('sha256').update(bytes).digest('hex'),
    image: { mime: 'image/png', width: 4, height: 5 }
  };
  validateLocalFile(asset, root);
  asset.image.width = 6;
  assert.throws(() => validateLocalFile(asset, root), /dimensions/);
});
