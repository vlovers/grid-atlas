import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPrivateOriginalDirectory } from '../scripts/private-original-directory.mjs';

const repoRoot = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
function privateTemp(callback) {
  const parent = mkdtempSync(join(realpathSync(tmpdir()), 'grid-atlas-original-dir-'));
  try { return callback(parent); } finally { rmSync(parent, { recursive: true, force: true }); }
}

test('accepts an owner-only existing directory outside the repository', () => privateTemp(dir => {
  assert.equal(assertPrivateOriginalDirectory(dir), realpathSync(dir));
}));

test('rejects a direct symlink to an external private directory', () => privateTemp(dir => {
  const link = join(dir, 'alias');
  symlinkSync(dir, link);
  assert.throws(() => assertPrivateOriginalDirectory(link), /symlink/);
}));

test('rejects repository directories even if reached through a parent symlink', () => privateTemp(dir => {
  const link = join(dir, 'repo-alias');
  symlinkSync(repoRoot, link);
  assert.throws(() => assertPrivateOriginalDirectory(join(link, 'apps', 'web', 'public')), /outside the repository/);
}));

test('rejects newly created private directories inside the repository', () => {
  const dir = mkdtempSync(join(repoRoot, '.test-originals-'));
  try {
    assert.throws(() => assertPrivateOriginalDirectory(dir), /outside the repository/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rejects world-readable directories even outside the repository', () => privateTemp(dir => {
  const publicDir = join(dir, 'public');
  mkdirSync(publicDir, { mode: 0o755 });
  chmodSync(publicDir, 0o755);
  assert.throws(() => assertPrivateOriginalDirectory(publicDir), /chmod 700/);
}));

test('rejects empty directory argument', () => {
  assert.throws(() => assertPrivateOriginalDirectory(''), /Explicit existing/);
});
