import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync('apps/web/src/app/[locale]/page.tsx', 'utf8');
const css = readFileSync('apps/web/src/app/[locale]/home.module.css', 'utf8');
const manifest = JSON.parse(readFileSync('apps/web/src/components/circuit-layout-manifest.json', 'utf8'));

test('home circuit illustrations require the exact archived layout identities', () => {
  assert.match(home, /getData<\{ external_layout_id: string; effective: boolean \}>/);
  assert.match(home, /\/api\/circuits\/\$\{circuit\.id\}\/layouts/);
  assert.match(home, /selectCircuitCoverArtwork\(layouts\)/);
  assert.match(home, /circuitArtworks\[index\] &&/);
  assert.doesNotMatch(home, /circuitArtworks\[index\] \?\?/);
});

test('home imagery preserves author license and bilingual exact layout labels', () => {
  assert.match(home, /circuitArtworks\[index\]\.author/);
  assert.match(home, /circuitArtworks\[index\]\.license/);
  assert.match(home, /circuitArtworks\[index\]\.layout_id/);
  assert.match(home, /Контур конфігурації/);
  assert.match(home, /Historical layout/);
  assert.match(css, /\.circuitPreview img/);
  assert.match(css, /object-fit: contain/);
  assert.ok(manifest.length >= 150, 'Expected pinned historical circuit outlines');
});
