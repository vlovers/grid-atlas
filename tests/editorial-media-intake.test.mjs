import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('editorial image intake stays private and records reproducible byte evidence', () => {
  const script = read('scripts/editorial-media-intake.mjs');
  assert.match(script, /\.grid-atlas\/media-review/);
  assert.match(script, /createHash\('sha256'\)\.update\(bytes\)\.digest\('hex'\)/);
  assert.match(script, /stagedSha256:/);
  assert.match(script, /stagedSize: bytes\.length/);
  assert.match(script, /stagedMime: type/);
  assert.match(script, /UNREVIEWED — DO NOT PUBLISH/);
  assert.doesNotMatch(script, /apps\/web\/public/);
});

test('editorial workflow cannot automatically publish review-only images', () => {
  const workflow = read('.github/workflows/editorial-photo-intake.yml');
  assert.match(workflow, /Upload private review package/);
  assert.doesNotMatch(workflow, /git add apps\/web\/public\/media/);
  // Push is allowed only for quarantining tracked public files, never for publishing candidates.
  assert.match(workflow, /git rm -- "\$file"/);
  assert.match(workflow, /persist-credentials:\s+false/);
  assert.match(workflow, /push origin HEAD:editorial\/people-who-changed-f1-20261025/);
  assert.match(workflow, /Remove accidentally published unreviewed media/);
});

test('story photos remain gated until the canonical registry approves them', () => {
  const photos = read('apps/web/src/components/stories/editorial-media.ts');
  const registry = JSON.parse(read('apps/web/src/components/media/publication.json'));
  assert.deepEqual(registry.assets, []);
  assert.match(photos, /editorialPhotos: Partial<Record<string, EditorialPhoto>> = \{\}/);
  assert.match(photos, /publication\.assets/);
  assert.match(photos, /asset\.status === 'verified'/);
  assert.match(photos, /asset\.review\?\.actor === 'human'/);
  assert.match(photos, /asset\.delivery\.local_path === photo\.src/);
});
