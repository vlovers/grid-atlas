import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../apps/web/src/components/editorial/archive-features.tsx', import.meta.url), 'utf8');
const browser = readFileSync(new URL('./browser/unified-archive.spec.ts', import.meta.url), 'utf8');

test('featured archive cards navigate normally without speculative RSC prefetch', () => {
  assert.match(source, /<h3><Link href=\{`\/\$\{kind\}\/\$\{entity\.id\}`\} prefetch=\{false\}>/);
  assert.match(source, /<Link href=\{`\/\$\{kind\}\/\$\{entity\.id\}`\} prefetch=\{false\}>\{t\.open\}/);
  assert.match(browser, /await link\.press\('Enter'\)/);
  assert.match(browser, /await expect\(page\)\.toHaveURL/);
  assert.match(browser, /page\.on\('pageerror'/);
});
