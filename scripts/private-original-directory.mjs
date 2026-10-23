import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = realpathSync(fileURLToPath(new URL('../', import.meta.url)));

/**
 * Original media is research-only and must never be written into the Git tree,
 * including apps/web/public. Resolve parent symlinks before containment checks.
 * Only a newly created, owner-private directory is suitable for originals.
 */
export function assertPrivateOriginalDirectory(outputDir) {
  if (typeof outputDir !== 'string' || !outputDir.trim()) {
    throw Error('Explicit existing private originals directory required');
  }
  const requested = resolve(outputDir);
  const stat = lstatSync(requested);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw Error('Private originals directory must be a directory, not a symlink');
  }
  const canonical = realpathSync(requested);
  const inside = relative(repositoryRoot, canonical);
  if (inside === '' || (inside !== '..' && !inside.startsWith('..' + sep) && !isAbsolute(inside))) {
    throw Error('Private originals directory must be outside the repository');
  }
  if ((stat.mode & 0o077) !== 0) {
    throw Error('Private originals directory must be owner-only (chmod 700)');
  }
  return canonical;
}
