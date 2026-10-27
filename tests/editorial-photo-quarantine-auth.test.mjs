import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/editorial-photo-intake.yml', 'utf8');
const quarantineJobMarker = '\n  quarantine:\n';
const quarantineJobIndex = workflow.indexOf(quarantineJobMarker);
const quarantineMarker = '      - name: Remove accidentally published unreviewed media';
const quarantineIndex = workflow.indexOf(quarantineMarker);
const stageJob = workflow.slice(workflow.indexOf('\n  stage:\n'), quarantineJobIndex);
const quarantineJob = workflow.slice(quarantineJobIndex);
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
  assert.ok(quarantineJobIndex > 0, 'separate quarantine job must exist');
  assert.match(workflow, /^permissions:\s*\n\s+contents: read/m);
  assert.doesNotMatch(stageJob, /contents:\s*write/);
  assert.match(stageJob, /if: github\.event_name != 'push'/);
  assert.match(quarantineJob, /permissions:\s*\n\s+contents: write/);
  assert.match(quarantineJob, /if: github\.event_name == 'push' && github\.ref_name == 'editorial\/people-who-changed-f1-20261025'/);
  assert.match(quarantineJob, /persist-credentials:\s+false/);
  assert.doesNotMatch(quarantineJob, /run: node scripts\//);
  assert.doesNotMatch(stageJob, /GH_TOKEN:/);
  assert.match(quarantineStep, /if: github\.event_name == 'push' && github\.ref_name == 'editorial\/people-who-changed-f1-20261025'/);
  assert.match(quarantineStep, /GH_TOKEN:\s*\$\{\{ github\.token \}\}/);
  assert.doesNotMatch(beforeQuarantine, /GH_TOKEN:/);
  assert.match(quarantineStep, /git push|git -c .* push origin HEAD:editorial\/people-who-changed-f1-20261025/);
});

test('push trigger includes every public image the quarantine step removes', () => {
  const pushStart = workflow.indexOf('\n  push:\n');
  const pushEnd = workflow.indexOf('\n  workflow_dispatch:', pushStart);
  assert.ok(pushStart >= 0 && pushEnd > pushStart, 'push event paths must be present');
  const pushConfig = workflow.slice(pushStart, pushEnd);
  const protectedPaths = [
    'apps/web/public/media/editorial/vettel-monza-2008.jpg',
    'apps/web/public/media/editorial/brawn-2009.jpg',
  ];
  for (const file of protectedPaths) {
    assert.ok(pushConfig.includes("- '" + file + "'"), 'push paths must include ' + file);
    assert.ok(quarantineStep.includes(file), 'quarantine must remove ' + file);
  }
  assert.match(stageJob, /persist-credentials:\s*false/);
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
