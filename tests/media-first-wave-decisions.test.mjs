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
