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

test('repository-wide action pin compliance is an explicit opt-in until migration', { skip: process.env.GRID_ATLAS_ENFORCE_ACTION_PINS !== '1' }, () => {
  assert.ok(assertWorkflowActionsPinned() >= 10);
});

test('repository-wide action pin audit fails closed on mutable fixture', () => {
  const yaml = 'steps:\n  - uses: actions/checkout@v4\n';
  assert.match(auditWorkflowText(yaml)[0], /immutable SHA/);
});


test('rejects whitespace before uses key colon', () => {
  for (const key of ['uses', '"uses"', "'uses'"]) {
    const yaml = 'steps:\n  - ' + key + ' : actions/upload-artifact@v4\n';
    assert.match(auditWorkflowText(yaml)[0], /ambiguous action reference/);
  }
});

test('rejects empty uses keys instead of silently skipping them', () => {
  assert.match(auditWorkflowText('steps:\n  - uses:\n')[0], /immutable SHA/);
  assert.match(auditWorkflowText('steps:\n  - uses: # unset\n')[0], /immutable SHA/);
});

test('rejects dynamic local action references', () => {
  const yaml = 'steps:\n  - uses: ./.github/actions/${{ inputs.action }}\n';
  assert.match(auditWorkflowText(yaml)[0], /static in-repository/);
});

test('rejects local action traversal and empty path segments', () => {
  for (const reference of ['./../outside', './tools/../outside', './tools//action', './tools/./action']) {
    assert.match(auditWorkflowText('steps:\n  - uses: ' + reference + '\n')[0], /static in-repository/, reference);
  }
});

test('accepts valid static local action paths including dot-prefixed folders', () => {
  assert.deepEqual(auditWorkflowText('steps:\n  - uses: ./.github/actions/safe\n'), []);
});

test('rejects external action traversal and malformed repository paths', () => {
  const sha = 'a'.repeat(40);
  for (const reference of ['owner/../tool@' + sha, 'owner//tool@' + sha, 'owner/./tool@' + sha]) {
    assert.match(auditWorkflowText('steps:\n  - uses: ' + reference + '\n')[0], /immutable SHA/, reference);
  }
});

test('accepts a nested third-party action path pinned to full SHA', () => {
  assert.deepEqual(auditWorkflowText('steps:\n  - uses: owner/repo/path@' + 'a'.repeat(40) + '\n'), []);
});

test('rejects expression-driven third-party references', () => {
  const yaml = 'steps:\n  - uses: owner/repo@${{ inputs.revision }}\n';
  assert.match(auditWorkflowText(yaml)[0], /immutable SHA/);
});


test('rejects dynamic or ambiguous Docker image references', () => {
  const digest = 'b'.repeat(64);
  for (const reference of [
    'docker://${{inputs.image}}@sha256:' + digest,
    'docker://alpine@sha256:' + digest + '@sha256:' + digest,
    'docker://alpine:latest',
  ]) {
    assert.match(auditWorkflowText('steps:\n  - uses: ' + reference + '\n')[0], /immutable SHA/, reference);
  }
});

test('accepts static registry and port with an immutable Docker digest', () => {
  const yaml = 'steps:\n  - uses: docker://registry.example.org:5000/team/image:1.0@sha256:' + 'a'.repeat(64) + '\n';
  assert.deepEqual(auditWorkflowText(yaml), []);
});

test('rejects quoted mutable uses keys and ambiguous inline action mappings', () => {
  assert.match(auditWorkflowText("steps:\n  - 'uses': actions/checkout@v4\n")[0], /immutable SHA/);
  assert.match(auditWorkflowText('steps:\n  - { name: checkout, uses: actions/checkout@v4 }\n')[0], /unsupported YAML/);
});

test('rejects anchored action declarations and trailing action tokens', () => {
  assert.match(auditWorkflowText('steps:\n  - &step uses: actions/checkout@v4\n')[0], /unsupported YAML/);
  assert.match(auditWorkflowText('steps:\n  - uses: actions/checkout@v4 extra\n')[0], /ambiguous action/);
});

test('rejects duplicate checkout with mappings and credential keys', () => {
  const duplicateWith = `steps:
  - uses: ${checkout}
    with:
      persist-credentials: false
    with:
      persist-credentials: true
`;
  const duplicateCredential = `steps:
  - uses: ${checkout}
    with:
      persist-credentials: false
      persist-credentials: true
`;
  assert.match(auditWorkflowText(duplicateWith)[0], /exactly once/);
  assert.match(auditWorkflowText(duplicateCredential)[0], /exactly once/);
});

test('accepts pinned checkout with a trailing YAML comment', () => {
  const yaml = `steps:
  - uses: ${checkout} # immutable
    with:
      persist-credentials: false # do not retain token
`;
  assert.deepEqual(auditWorkflowText(yaml), []);
});

test('rejects escaped YAML keys that decode to uses or checkout credentials', () => {
  const escapedUses = 'steps:\n  - "\\u0075ses": actions/upload-artifact@v4\n';
  const escapedFlow = 'steps:\n  - { "\\u0075ses": actions/upload-artifact@v4 }\n';
  const escapedCredential = 'steps:\n  - uses: ' + checkout +
    '\n    with:\n      persist-credentials: false\n      "persist-\\u0063redentials": true\n';
  for (const yaml of [escapedUses, escapedFlow, escapedCredential]) {
    assert.match(auditWorkflowText(yaml)[0], /escaped YAML mapping key/);
  }
});

test('rejects duplicate checkout credentials with YAML whitespace before colon', () => {
  const yaml = `steps:
  - uses: ${checkout}
    with:
      persist-credentials: false
      persist-credentials : true
`;
  assert.match(auditWorkflowText(yaml)[0], /exactly once/);
});

test('rejects explicit YAML keys that could override checkout security settings', () => {
  for (const key of ['with', 'persist-credentials', 'uses', '"with"', "'persist-credentials'"]) {
    const yaml = `steps:
  - uses: ${checkout}
    with:
      persist-credentials: false
      ? ${key}
      : true
`;
    assert.match(auditWorkflowText(yaml)[0], /unsupported explicit YAML security key/, key);
  }
});


test('checkout credential policy cannot be bypassed by mixed-case repository spelling', () => {
  for (const name of ['Actions/Checkout', 'actions/Checkout', 'ACTIONS/CHECKOUT']) {
    const reference = name + '@' + checkout.split('@')[1];
    const withoutCredentials = 'steps:\n  - uses: ' + reference + '\n';
    const withCredentials = withoutCredentials + '    with:\n      persist-credentials: false\n';
    assert.match(auditWorkflowText(withoutCredentials)[0], /persist-credentials/, name);
    assert.deepEqual(auditWorkflowText(withCredentials), [], name);
  }
});
