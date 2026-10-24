import test from 'node:test';
import assert from 'node:assert/strict';
import { auditWorkflowText, assertWorkflowActionsPinned } from '../scripts/check-workflow-action-pins.mjs';

const checkout = 'actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5';
const upload = 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02';

test('pinned checkout with disabled persisted credentials is accepted', () => {
  const yaml = 'steps:\n  - uses: ' + checkout + '\n    with:\n      persist-credentials: false\n  - uses: ' + upload + '\n';
  assert.deepEqual(auditWorkflowText(yaml), []);
});

test('rejects mutable major tags and short SHAs', () => {
  assert.equal(auditWorkflowText('steps:\n  - uses: actions/upload-artifact@v4\n').length, 1);
  assert.equal(auditWorkflowText('steps:\n  - uses: actions/upload-artifact@ea165f8\n').length, 1);
});

test('rejects checkout without an explicit false credentials setting', () => {
  const yaml = 'steps:\n  - uses: ' + checkout + '\n    with:\n      fetch-depth: 0\n';
  assert.match(auditWorkflowText(yaml)[0], /persist-credentials/);
});

test('does not accept credential settings from a later step', () => {
  const yaml = 'steps:\n  - uses: ' + checkout + '\n  - name: Later step\n    with:\n      persist-credentials: false\n';
  assert.match(auditWorkflowText(yaml)[0], /persist-credentials/);
});

test('rejects nested checkout credentials setting under unrelated option', () => {
  const yaml = `steps:
  - uses: ${checkout}
    with:
      unrelated:
        persist-credentials: false
`;
  assert.match(auditWorkflowText(yaml)[0], /persist-credentials/);
});

test('rejects checkout credentials from a nested env mapping', () => {
  const yaml = `steps:
  - uses: ${checkout}
    with:
      fetch-depth: 0
    env:
      persist-credentials: false
`;
  assert.match(auditWorkflowText(yaml)[0], /persist-credentials/);
});

test('accepts local actions and immutable Docker digests, rejects Docker tags', () => {
  const yaml = 'steps:\n  - uses: ./tools/local-action\n  - uses: docker://alpine@sha256:' + 'a'.repeat(64) + '\n';
  assert.deepEqual(auditWorkflowText(yaml), []);
  assert.equal(auditWorkflowText('steps:\n  - uses: docker://alpine:latest\n').length, 1);
});

test('all repository workflows comply with action pin and checkout policy', () => {
  assert.ok(assertWorkflowActionsPinned() >= 10);
});
