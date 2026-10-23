import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectImageBytes } from '../scripts/inspect-media-original.mjs';

test('rejects invalid image bytes', () => {
  assert.throws(() => inspectImageBytes(Buffer.alloc(30)), /unsupported/);
});
