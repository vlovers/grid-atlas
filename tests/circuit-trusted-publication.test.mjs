import '../apps/api/test/circuit-editorial.contract.test.cjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { argumentsFor } = require('../apps/api/scripts/circuit-editorial-operation.cjs');
test('server operation interface refuses caller identities, malformed revisions and unexpected arguments', () => {
  assert.deepEqual(argumentsFor(['inspect', '1']), { action: 'inspect', article: '1', revision: undefined, reviewId: undefined });
  assert.equal(argumentsFor(['publish', '1', 'a'.repeat(64), '2']).reviewId, '2');
  for (const args of [['approve', '1'], ['review', '1', 'bad'], ['publish', '1', 'a'.repeat(64)],
    ['inspect', '1', 'Invented reviewer'], ['inspect', '9223372036854775808'], ['withdraw', '0']]) assert.throws(() => argumentsFor(args), /Usage/);
});
