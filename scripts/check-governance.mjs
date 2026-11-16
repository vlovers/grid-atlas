#!/usr/bin/env node
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const required = [
  'AGENTS.md', 'CLAUDE.md', '.github/PULL_REQUEST_TEMPLATE.md',
  'docs/engineering/MULTI_AGENT_WORKFLOW.md',
  'docs/engineering/DEFINITION_OF_DONE.md',
  'docs/engineering/REVIEW_POLICY.md',
  'docs/engineering/RELEASE_CHECKLIST.md',
];

const markers = {
  'AGENTS.md': ['MULTI_AGENT_WORKFLOW.md', 'worktree', 'review'],
  'CLAUDE.md': ['AGENTS.md'],
  '.github/PULL_REQUEST_TEMPLATE.md': ['MULTI_AGENT_WORKFLOW.md', 'head SHA', 'review'],
  'docs/engineering/MULTI_AGENT_WORKFLOW.md': ['worktree', 'Issue', 'review'],
};

function within(root, target) {
  const rel = relative(root, target);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

export function verifyGovernance(root) {
  const errors = [];
  root = realpathSync(resolve(root));
  for (const path of required) {
    let contents;
    try {
      const file = resolve(root, path);
      if (!within(root, realpathSync(file)) || !statSync(file).isFile()) throw new Error('not a file');
      contents = readFileSync(file, 'utf8');
    } catch {
      errors.push(`${path}: missing or unreadable`);
      continue;
    }
    if (contents.trim().length < 20) errors.push(`${path}: unexpectedly empty`);
    for (const marker of markers[path] || []) {
      if (!contents.toLowerCase().includes(marker.toLowerCase())) {
        errors.push(`${path}: missing contract marker "${marker}"`);
      }
    }
    const pattern = /(?<!!)\[[^\]\n]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;
    for (const match of contents.matchAll(pattern)) {
      const href = match[1];
      if (/^(?:[a-z][\da-z+.-]*:|\/|#|\{|<)/i.test(href)) continue;
      let target;
      try {
        const decoded = decodeURIComponent(href.split('#')[0].split('?')[0]);
        if (!decoded) continue;
        target = resolve(root, dirname(path), decoded);
      } catch {
        errors.push(`${path}: invalid relative link ${href}`);
        continue;
      }
      if (!within(root, target)) {
        errors.push(`${path}: link escapes repository: ${href}`);
        continue;
      }
      try {
        if (!within(root, realpathSync(target))) {
          errors.push(`${path}: link escapes repository via symlink: ${href}`);
          continue;
        }
        const stat = statSync(target);
        if (!stat.isFile() && !stat.isDirectory()) throw new Error('not file or dir');
      } catch {
        errors.push(`${path}: broken local link ${href}`);
      }
    }
  }
  return errors.sort();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = verifyGovernance(process.argv[2] || process.cwd());
  if (failures.length) {
    console.error('Governance contract FAILED:\n' + failures.map(x => '- ' + x).join('\n'));
    process.exitCode = 1;
  } else console.log('Governance contract: PASS');
}
