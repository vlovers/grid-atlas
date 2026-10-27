import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/editorial-photo-intake.yml', 'utf8');
const quarantineMarker = '      - name: Remove accidentally published unreviewed media';
const quarantineIndex = workflow.indexOf(quarantineMarker);
const beforeQuarantine = workflow.slice(0, quarantineIndex);
const quarantineStep = workflow.slice(quarantineIndex);

test('photo intake keeps immutable actions and does not persist checkout credentials', () => {
  assert.ok(quarantineIndex > 0, 'quarantine step must exist');
  for (const action of ['checkout', 'setup-node', 'upload-artifact']) {
    assert.match(workflow, new RegExp('uses:\\s+actions/' + action + '@[a-f0-9]{40}\\b'));
  }
  assert.doesNotMatch(workflow, /uses:\s+actions\/[\w-]+@v\d+/);
  assert.match(workflow, /persist-credentials:\s+false/);
  assert.doesNotMatch(workflow, /persist-credentials:\s+true/);
  assert.match(workflow, /permissions:\s*\n\s+contents: write/);
  assert.match(quarantineStep, /if: github\.event_name == 'push' && github\.ref_name == 'editorial\/people-who-changed-f1-20261025'/);
  assert.match(quarantineStep, /GH_TOKEN:\s*\$\{\{ github\.token \}\}/);
  assert.doesNotMatch(beforeQuarantine, /GH_TOKEN:/);
  assert.match(quarantineStep, /git push|git -c .* push origin HEAD:editorial\/people-who-changed-f1-20261025/);
});

test('quarantine push credential helper uses a step-scoped token without storing it', () => {
  const match = quarantineStep.match(/git -c 'credential\.helper=([^']+)' push origin HEAD:editorial\/people-who-changed-f1-20261025/);
  assert.ok(match, 'push must use an explicit credential helper');
  assert.doesNotMatch(match[1], /fixture-token|ghp_|github_pat_/);
  const result = spawnSync('git', ['-c', 'credential.helper=' + match[1], 'credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
    env: { ...process.env, GH_TOKEN: 'test-only-placeholder' },
    timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /username=x-access-token/);
  assert.match(result.stdout, /password=test-only-placeholder/);
});
