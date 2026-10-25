import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read-only, dependency-free guard: no mutable third-party Actions refs.
export function auditWorkflowText(source, filename = 'workflow') {
  const lines = source.split(/\r?\n/);
  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    // Check all uses keys, including empty references; fail closed on dynamic refs.
    const line = lines[i];
    if (/^\s*#/.test(line)) continue;
    // Reject YAML forms that can hide an action from this intentionally small scanner.
    if (/^\s*(?:-\s*)?\{.*(?:['"]?uses['"]?)\s*:/.test(line) ||
        /^\s*(?:-\s+)?\?\s*['"]?uses['"]?\s*$/.test(line) ||
        /^\s*(?:-\s+)?&[A-Za-z0-9_-]+\s+['"]?uses['"]?\s*:/.test(line) ||
        /^\s*(?:-\s+)?<<\s*:/.test(line)) {
      findings.push(filename + ':' + (i + 1) + ': unsupported YAML structure near action reference');
      continue;
    }
    const match = /^(\s*)(?:-\s+)?(?:uses|['"]uses['"]):\s*(\S*)(?:\s+(?:#.*)?)?$/.exec(line);
    if (!match) {
      if (/^\s*(?:-\s+)?(?:uses|['"]uses['"])\s*:/.test(line)) {
        findings.push(filename + ':' + (i + 1) + ': ambiguous action reference');
      }
      continue;
    }
    const [, indentation, reference] = match;
    const local = reference.startsWith('./') &&
      /^\.\/[A-Za-z0-9_./-]+$/.test(reference) &&
      reference.slice(2).split('/').every((part) => part !== '' && part !== '.' && part !== '..');
    const actionPath = reference.split('@')[0];
    const pinnedAction = /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+@[a-f0-9]{40}$/.test(reference) &&
      actionPath.split('/').every((part) => part !== '.' && part !== '..');
    const pinnedDocker = /^docker:\/\/[A-Za-z0-9_.:/-]+@sha256:[a-f0-9]{64}$/.test(reference);
    if (!local && !pinnedAction && !pinnedDocker) {
      findings.push(filename + ':' + (i + 1) + ': action must use a static in-repository path or full immutable SHA/digest: ' + (reference || '<empty>'));
    }
    if (!reference.startsWith('actions/checkout@')) continue;
    let end = i + 1;
    while (end < lines.length) {
      const line = lines[end];
      if (line.trim() && line.match(/^\s*/)[0].length <= indentation.length) break;
      end++;
    }
    const stepLines = lines.slice(i + 1, end);
    const usesIndent = indentation.length;
    const withLines = stepLines.map((line, index) => ({ line, index }))
      .filter(({ line }) => /^\s*(?:with|['"]with['"])\s*:/.test(line) &&
        line.match(/^\s*/)[0].length === usesIndent + 2);
    let credentialsDisabled = false;
    let credentialCount = 0;
    if (withLines.length === 1 && /^\s*(?:with|['"]with['"]):\s*(?:#.*)?$/.test(withLines[0].line)) {
      const withLine = withLines[0].index;
      const withIndent = stepLines[withLine].match(/^\s*/)[0].length;
      for (let j = withLine + 1; j < stepLines.length; j++) {
        const line = stepLines[j];
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const keyIndent = line.match(/^\s*/)[0].length;
        if (keyIndent <= withIndent) break;
        if (keyIndent === withIndent + 2 &&
            /^\s*(?:persist-credentials|['"]persist-credentials['"]):\s*/.test(line)) {
          credentialCount++;
          credentialsDisabled = /^\s*(?:persist-credentials|['"]persist-credentials['"]):\s*false\s*(?:#.*)?$/.test(line);
        }
      }
    }
    if (!credentialsDisabled || credentialCount !== 1) {
      findings.push(filename + ':' + (i + 1) + ': checkout must set persist-credentials: false exactly once in one with mapping');
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
