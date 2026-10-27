import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/editorial-photo-intake.yml', 'utf8');

test('photo intake defaults to read-only permissions', () => {
  assert.match(workflow, /^permissions:\s*\n  contents: read$/m);
  assert.match(workflow, /^    permissions:\s*\n      contents: \$\{\{ github\.event_name == 'push' && 'write' \|\| 'read' \}\}$/m);
  assert.doesNotMatch(workflow, /^permissions:\s*\n  contents: write$/m);
});

test('quarantine push uses a step-scoped token with checkout credentials disabled', () => {
  assert.match(workflow, /persist-credentials: false/);
  const quarantine = workflow.split('      - name: Remove accidentally published unreviewed media')[1];
  assert.ok(quarantine, 'quarantine step exists');
  assert.match(quarantine, /if: github\.event_name == 'push' && github\.ref_name == 'editorial\/people-who-changed-f1-20261025'/);
  assert.match(quarantine, /env:\s*\n          GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(quarantine, /gh auth setup-git\s*\n            git push origin HEAD:editorial\/people-who-changed-f1-20261025/);
  assert.doesNotMatch(workflow.split('      - name: Remove accidentally published unreviewed media')[0], /GH_TOKEN:/);
});
