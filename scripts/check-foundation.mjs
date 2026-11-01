import { existsSync, readFileSync } from 'node:fs';
import { assertWorkflowActionsPinned } from './check-workflow-action-pins.mjs';

const required = [
  'README.md', 'package.json', 'pnpm-workspace.yaml', '.env.example',
  'compose.yaml', '.github/workflows/ci.yml',
  'docs/architecture/overview.md', 'docs/decisions/0001-monorepo-and-historical-data.md',
  'docs/data-sources/README.md', 'docs/roadmap/README.md',
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!pkg.private || !pkg.packageManager?.startsWith('pnpm@')) {
  throw new Error('Workspace must be private and pin pnpm');
}
const workflowCount = assertWorkflowActionsPinned();
console.log('Foundation files validated; ' + workflowCount + ' workflows use immutable actions');
