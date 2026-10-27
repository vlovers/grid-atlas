import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/editorial-photo-intake.yml', 'utf8');

test('photo intake defaults to read-only permissions', () => {
  assert.match(workflow, /^permissions:\s*\n {2}contents: read$/m);
  assert.match(workflow, /^ {4}permissions:\s*\n {6}contents: write$/m);
  assert.match(workflow, /^ {2}quarantine:/m);
  assert.match(workflow, /^ {4}if: github\.event_name == 'push' && github\.ref_name == 'editorial\/people-who-changed-f1-20261025'$/m);
  assert.doesNotMatch(workflow, /^permissions:\s*\n {2}contents: write$/m);
});

test('read-only staging cannot inherit quarantine write permissions', () => {
  const stage = workflow.split('  stage:')[1]?.split('  quarantine:')[0];
  const quarantine = workflow.split('  quarantine:')[1];
  assert.ok(stage, 'staging job exists');
  assert.ok(quarantine, 'quarantine job exists');
  assert.match(stage, /if: github\.event_name != 'push'/);
  assert.doesNotMatch(stage, /contents:\s*write/);
  assert.doesNotMatch(stage, /GH_TOKEN:/);
  assert.match(stage, /persist-credentials: false/);
  assert.match(quarantine, /permissions:\s*\n {6}contents: write/);
  assert.match(quarantine, /persist-credentials: false/);
});

test('quarantine push uses a step-scoped token with checkout credentials disabled', () => {
  assert.match(workflow, /persist-credentials: false/);
  const quarantine = workflow.split('      - name: Remove accidentally published unreviewed media')[1];
  assert.ok(quarantine, 'quarantine step exists');
  assert.match(quarantine, /if: github\.event_name == 'push' && github\.ref_name == 'editorial\/people-who-changed-f1-20261025'/);
  assert.match(quarantine, /env:\s*\n {10}GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(quarantine, /credential\.helper=.*push origin HEAD:editorial\/people-who-changed-f1-20261025/);
  assert.doesNotMatch(workflow.split('      - name: Remove accidentally published unreviewed media')[0], /GH_TOKEN:/);
});

test('quarantine push triggers for changes to protected public images', () => {
  const pushPaths = workflow.split('  push:')[1]?.split('  workflow_dispatch:')[0];
  assert.ok(pushPaths, 'push path filters exist');
  assert.ok(pushPaths.includes('apps/web/public/media/editorial/vettel-monza-2008.jpg'));
  assert.ok(pushPaths.includes('apps/web/public/media/editorial/brawn-2009.jpg'));
});
