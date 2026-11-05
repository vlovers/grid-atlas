import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { required, verifyGovernance } from '../scripts/check-governance.mjs';

function withFixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'grid-governance-'));
  try {
    for (const file of required) {
      const path = join(root, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, '# Governance\n\nIndependent review and verification.\n');
    }
    writeFileSync(join(root, 'AGENTS.md'), '# Agents\n\nDedicated worktree and review: [workflow](docs/engineering/MULTI_AGENT_WORKFLOW.md)\n');
    writeFileSync(join(root, 'CLAUDE.md'), '# Claude\n\nFollow [AGENTS.md](AGENTS.md) for reviews.\n');
    writeFileSync(join(root, '.github/PULL_REQUEST_TEMPLATE.md'), '# PR\n\nhead SHA review [workflow](../docs/engineering/MULTI_AGENT_WORKFLOW.md)\n');
    writeFileSync(join(root, 'docs/engineering/MULTI_AGENT_WORKFLOW.md'), '# Protocol\n\nIssue worktree independent review and evidence.\n');
    run(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('passes consistent contract', () => withFixture(root => {
  assert.deepEqual(verifyGovernance(root), []);
}));
test('fails missing policy', () => withFixture(root => {
  rmSync(join(root, 'docs/engineering/REVIEW_POLICY.md'));
  assert.match(verifyGovernance(root).join('\n'), /REVIEW_POLICY.md: missing/);
}));
test('fails broken relative link', () => withFixture(root => {
  writeFileSync(join(root, 'CLAUDE.md'), '# Claude\n\n[AGENTS.md](AGENTS.md) and [broken](missing.md)\n');
  assert.match(verifyGovernance(root).join('\n'), /broken local link missing.md/);
}));
test('fails missing PR review contract', () => withFixture(root => {
  writeFileSync(join(root, '.github/PULL_REQUEST_TEMPLATE.md'), '# PR\n\nReview [workflow](../docs/engineering/MULTI_AGENT_WORKFLOW.md)\n');
  assert.match(verifyGovernance(root).join('\n'), /missing contract marker "head SHA"/);
}));
test('fails escaping links', () => withFixture(root => {
  writeFileSync(join(root, 'CLAUDE.md'), '# Claude\n\nFollow [AGENTS.md](AGENTS.md) and [external](../../outside.md)\n');
  assert.match(verifyGovernance(root).join('\n'), /link escapes repository/);
}));
