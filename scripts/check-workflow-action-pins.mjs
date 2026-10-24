import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read-only, dependency-free guard: no mutable third-party Actions refs.
export function auditWorkflowText(source, filename = 'workflow') {
  const lines = source.split(/\r?\n/);
  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(?:-\s+)?uses:\s+(\S+)/.exec(lines[i]);
    if (!match) continue;
    const [, indentation, reference] = match;
    const local = reference.startsWith('./');
    const pinnedAction = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+@[a-f0-9]{40}$/.test(reference);
    const pinnedDocker = /^docker:\/\/[^\s]+@sha256:[a-f0-9]{64}$/.test(reference);
    if (!local && !pinnedAction && !pinnedDocker) {
      findings.push(filename + ':' + (i + 1) + ': external action must use a full immutable SHA/digest: ' + reference);
    }
    if (!reference.startsWith('actions/checkout@')) continue;
    let end = i + 1;
    while (end < lines.length) {
      const line = lines[end];
      if (line.trim() && line.match(/^\s*/)[0].length <= indentation.length) break;
      end++;
    }
    const checkoutStep = lines.slice(i + 1, end).join('\n');
    if (!/^\s+with:\s*$/m.test(checkoutStep) ||
        !/^\s+persist-credentials:\s*false\s*(?:#.*)?$/m.test(checkoutStep)) {
      findings.push(filename + ':' + (i + 1) + ': checkout must explicitly set persist-credentials: false');
    }
  }
  return findings;
}

export function assertWorkflowActionsPinned(directory = '.github/workflows') {
  const files = readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).sort();
  if (files.length === 0) throw new Error('No GitHub Actions workflows found in ' + directory);
  const findings = files.flatMap((name) =>
    auditWorkflowText(readFileSync(join(directory, name), 'utf8'), name));
  if (findings.length) throw new Error('Workflow security guard failed:\n' + findings.join('\n'));
  return files.length;
}
