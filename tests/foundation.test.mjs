import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('database is locally bound and health-checked', () => {
  const compose = readFileSync('compose.yaml', 'utf8');
  assert.match(compose, /127\.0\.0\.1:/);
  assert.match(compose, /pg_isready/);
});

test('CI restricts default token permissions', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /node-version: '24'/);
});
