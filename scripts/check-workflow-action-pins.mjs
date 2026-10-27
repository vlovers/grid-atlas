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
    // YAML decodes escaped double-quoted keys; a line scanner must not miss "uses".
    // Reject these mappings rather than trusting a literal-key regex.
    if (/^\s*(?:-\s+)?(?:\{|")/.test(line) &&
        /"(?:[^"\\]|\\.)*\\(?:[^"\\]|\\.)*"\s*:/.test(line)) {
      findings.push(filename + ':' + (i + 1) + ': unsupported escaped YAML mapping key');
      continue;
    }
    // Explicit mapping keys can override an earlier checkout `with` or credentials key.
    // A line-oriented guard cannot safely resolve these YAML structures.
    if (/^\s*(?:-\s*)?\?\s*(?:uses|with|persist-credentials|['"](?:uses|with|persist-credentials)['"])\s*$/.test(line)) {
      findings.push(filename + ':' + (i + 1) + ': unsupported explicit YAML security key');
      continue;
    }
    // Reject YAML forms that can hide an action from this intentionally small scanner.
    if (/^\s*(?:-\s*)?\{.*(?:['"]?uses['"]?)\s*:/.test(line) ||
        /^\s*(?:-\s+)?\?\s*['"]?uses['"]?\s*$/.test(line) ||
        /^\s*(?:-\s+)?&[A-Za-z0-9_-]+\s+['"]?uses['"]?\s*:/.test(line) ||
        /^\s*(?:-\s+)?<<\s*:/.test(line)) {
      findings.push(filename + ':' + (i + 1) + ': unsupported YAML structure near action reference');
      continue;
    }
    const match = /^(\s*)(?:-\s+)?(?:uses|['"]uses['"]):\s*(\S*)(.*)$/.exec(line);
    if (!match) {
      if (/^\s*(?:-\s+)?(?:uses|['"]uses['"])\s*:/.test(line)) {
        findings.push(filename + ':' + (i + 1) + ': ambiguous action reference');
      }
      continue;
    }
    const [, indentation, rawReference, rawTail] = match;
    let reference = rawReference.startsWith('#') ? '' : rawReference;
    const tail = rawReference.startsWith('#') ? '' : rawTail.trim();
    if (tail && !tail.startsWith('#')) {
      // GitHub expressions may contain spaces; they are still rejected as dynamic refs.
      if (reference.includes('${{') && tail.includes('}}')) {
        reference += ' ' + tail;
      } else {
        findings.push(filename + ':' + (i + 1) + ': ambiguous action reference');
        continue;
      }
    }
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
    // GitHub repository owner/name lookup is case-insensitive: mixed-case checkout
    // references must not bypass the credential persistence guard.
    if (!/^actions\/checkout@/i.test(reference)) continue;
    let end = i + 1;
    while (end < lines.length) {
      const line = lines[end];
      if (line.trim() && line.match(/^\s*/)[0].length <= indentation.length) break;
      end++;
    }
    const stepLines = lines.slice(i + 1, end);
    // A named step has "- name:" followed by "  uses:" and "  with:"
    // at the same indentation. A compact "- uses:" step puts "with:"
    // two columns deeper. Determine the step's own indentation, not the
    // indentation of the uses key alone.
    const namedStep = i > 0 && /^\\s*-\\s+(?:name|['"]name['"]):/.test(lines[i - 1]) &&
      lines[i - 1].match(/^\\s*/)[0].length + 2 === indentation.length;
    const withIndentExpected = indentation.length + (namedStep ? 0 : 2);
    const withLines = stepLines.map((line, index) => ({ line, index }))
      .filter(({ line }) => /^\s*(?:with|['"]with['"])\s*:/.test(line) &&
        line.match(/^\s*/)[0].length === withIndentExpected);
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
            /^\s*(?:persist-credentials|['"]persist-credentials['"])\s*:/.test(line)) {
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
