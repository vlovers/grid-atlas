import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectImageBytes } from '../scripts/inspect-media-original.mjs';

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
