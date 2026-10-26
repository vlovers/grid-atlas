import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(path, 'utf8'));

test('consolidation inventory preserves all research without treating it as publication', () => {
  const report = read('docs/editorial/CONTENT_CONSOLIDATION_V1_2026-10-26.json');
  const driverManifest = read('docs/editorial/batches/drivers-30-v1.json');
  const chapters = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
  const longform = read('docs/editorial/biography-expansion-batch-2/manifest.json');
  const constructorManifest = read('docs/editorial/constructors/batch-01-founders/manifest.json');
  assert.equal(report.drivers.length, 30);
  assert.deepEqual(report.drivers.map(row => row.driver_id), driverManifest.drivers.map(row => row.driver_id));
  assert.equal(new Set(report.drivers.map(row => row.driver_id)).size, 30);
  assert.equal(report.drivers.filter(row => row.track === 'longform_277_canonical').length, 10);
  assert.equal(report.drivers.filter(row => row.track === 'research_274_only').length, 20);
  assert.equal(report.drivers.reduce((total, row) => total + row.research_chapters, 0),
    chapters.stories.reduce((total, row) => total + row.chapters.length, 0));
  for (const row of report.drivers) {
    assert.equal(row.track === 'longform_277_canonical', longform.drivers.includes(row.driver_id));
    assert.equal(row.publication, 'unpublished');
    assert.deepEqual(row.required_locales, ['en', 'uk']);
  }
  assert.deepEqual(report.constructors.map(row => row.name), constructorManifest.subjects.map(row => row.name));
  for (const team of report.constructors) assert.equal(team.publication, 'blocked');
});
