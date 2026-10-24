import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('media wave decision matrix covers all eight existing research identities and never approves them', () => {
  const matrix = readFileSync('docs/media/first-wave-release-decisions.md', 'utf8');
  const candidates = JSON.parse(readFileSync('docs/media/candidates.json', 'utf8')).assets;
  const staged = JSON.parse(readFileSync('docs/media/cross-era-staging.json', 'utf8')).entries;
  const expected = [...candidates.filter(item => item.kind === 'portrait').map(item => item.id), ...staged.map(item => item.id)];
  assert.equal(expected.length, 8);
  for (const id of expected) {
    const lines = matrix.split('\n').filter(line => line.startsWith('| `' + id + '` |'));
    assert.equal(lines.length, 1, 'Missing or repeated research identity ' + id);
    assert.match(lines[0], /\| BLOCK \|$/);
  }
  const publication = JSON.parse(readFileSync('apps/web/src/components/media/publication.json', 'utf8'));
  assert.equal(publication.lane, 'publication');
  assert.deepEqual(publication.assets, []);
  assert.match(matrix, /fabricated human approvals are not/);
});

test('seven source-inspected candidates have exact Commons review locators, but are still blocked', () => {
  const sourceReview = readFileSync('docs/media/commons-source-recheck-2026-10-24.md', 'utf8');
  const expectedFiles = [
    'File:Michael_Schumacher.jpg',
    'File:Fernando_Alonso_(53838437751).jpg',
    'File:McLaren_MP4-4.jpg',
    'File:Ayrton_Senna_1989_Belgian_GP_podium_(cropped).jpg',
    'File:Lewis_Hamilton_(27333186713).jpg',
    'File:Ferrari_F2004.jpg',
    'File:Silverstone_Racing_Circuit.jpg',
  ];
  for (const file of expectedFiles) {
    assert.ok(sourceReview.includes('https://commons.wikimedia.org/wiki/' + file), file);
  }
  assert.match(sourceReview, /still have status \*\*BLOCK\*\*/);
  assert.match(sourceReview, /not a cryptographic original-byte inspection/);
});

test('read-only original-provenance report checks both observed binary hashes and excludes publication', async () => {
  const { execFileSync } = await import('node:child_process');
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-media-first-wave-readiness.mjs'], { encoding: 'utf8' }));
  assert.equal(report.research_only, true);
  assert.equal(report.source_count, 5);
  assert.equal(report.binary_sha256_observations, 2);
  assert.equal(report.public_assets, 0);
  assert.equal(report.publishable_count, 0);
  assert.equal(report.identities.length, 5);
  assert.deepEqual(report.failures, []);
  for (const identity of report.identities) {
    assert.equal(identity.rights_approved, false);
    assert.equal(identity.human_review, false);
    assert.equal(identity.publication_allowed, false);
    assert.ok(identity.blockers.includes('human_review_pending'));
  }
});

test('media source revision drift blocks readiness instead of publishing', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve, dirname } = await import('node:path');
  const root = mkdtempSync(join(tmpdir(), 'grid-atlas-media-tamper-'));
  const paths = [
    'docs/media/commons-original-evidence.json',
    'docs/media/verified-original-observations.json',
    'docs/media/cross-era-staging.json',
    'apps/web/src/components/media/publication.json',
  ];
  try {
    for (const path of paths) {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      if (path.includes('commons-original-evidence')) data.entries[0].description_oldid = null;
      const destination = join(root, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, JSON.stringify(data));
    }
    const result = spawnSync(process.execPath, [resolve('scripts/report-media-first-wave-readiness.mjs')],
      { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.ok(report.failures.some(message => message.includes('immutable Commons description revision')));
    assert.equal(report.publishable_count, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
