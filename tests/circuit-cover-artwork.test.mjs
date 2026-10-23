import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../', import.meta.url);
const file = path => readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(file('apps/web/src/components/circuit-layout-manifest.json'));

test('all cover options originate in the pinned licensed local SVG manifest', () => {
  assert.ok(manifest.length >= 150);
  const ids = new Set();
  for (const asset of manifest) {
    assert.match(asset.layout_id, /^[a-z0-9-]+$/);
    assert.equal(ids.has(asset.layout_id), false, 'duplicate layout: ' + asset.layout_id);
    ids.add(asset.layout_id);
    assert.equal(asset.path, '/circuit-layouts/' + asset.layout_id + '.svg');
    assert.match(asset.source_url, /^https:\/\/github\.com\/f1db\/f1db\/blob\/v2026\.17\.0\/src\/assets\/circuits\/white-outline\/[a-z0-9-]+\.svg$/);
    assert.match(asset.source_git_blob_sha, /^[a-f0-9]{40}$/);
    assert.equal(asset.author, 'Jules Roy');
    assert.equal(asset.license, 'CC-BY-4.0');
    assert.ok(existsSync(new URL('apps/web/public' + asset.path, root)), 'missing local SVG: ' + asset.path);
  }
});

test('cover selects only layouts returned by the current circuit API', () => {
  const source = file('apps/web/src/components/circuit-layout-registry.ts');
  assert.match(source, /CIRCUIT_ARTWORK\.get\(layout\.external_layout_id\)/);
  assert.match(source, /eligible\.find\(entry => entry\.layout\.effective\)/);
  assert.match(source, /\?\.artwork \?\? null/);
  const page = file('apps/web/src/app/[locale]/circuits/[id]/page.tsx');
  assert.match(page, /selectCircuitCoverArtwork\(layouts\)/);
  assert.match(page, /circuitArtwork=\{coverArtwork\}/);
});

test('cover provides bilingual alt text, attribution and fallback decorative art', () => {
  const header = file('apps/web/src/components/stories/story-header.tsx');
  assert.match(header, /Контур історичної конфігурації/);
  assert.match(header, /Historical .* layout outline/);
  assert.match(header, /circuitArtwork\.source_url/);
  assert.match(header, /creativecommons\.org\/licenses\/by\/4\.0/);
  assert.match(header, /<MotorsportArt/);
  assert.match(header, /rel="noopener noreferrer"/);
});

test('cover remains responsive and respects forced-color mode', () => {
  const css = file('apps/web/src/components/stories/stories.module.css');
  assert.match(css, /\.circuitHeroOutline/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /@media\(forced-colors:active\)/);
});
