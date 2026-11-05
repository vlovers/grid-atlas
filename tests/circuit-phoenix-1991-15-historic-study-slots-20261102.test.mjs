import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = new URL('../apps/web/src/components/editorial/', import.meta.url);
const corners = JSON.parse(readFileSync(new URL('circuit-corners-v3.json', base), 'utf8'));
const narratives = JSON.parse(readFileSync(new URL('circuit-narratives-v3.json', base), 'utf8'));
const assets = JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json', import.meta.url), 'utf8'));
const phoenix = corners.guides.find(g => g.circuit_id === 'phoenix');

test('1991 Phoenix has 15 distinct bilingual study entries, not invented official apex names', () => {
  assert.ok(phoenix);
  assert.equal(phoenix.layout_id, 'phoenix-2');
  assert.equal(phoenix.numbering_year, 1991);
  assert.equal(phoenix.numbered_turns, 15);
  assert.equal(phoenix.sections.length, 15);
  assert.match(phoenix.numbering_basis, /NOT independently matched/);
  assert.match(phoenix.numbering_basis, /1989–1990 phoenix-1 layout is different/);
  assert.equal(phoenix.review_status, 'independent_review_pending');
  assert.equal(phoenix.diagram, undefined);
  assert.deepEqual(phoenix.sections.flatMap(s => s.numbers), Array.from({ length: 15 }, (_, i) => i + 1));
  assert.equal(new Set(phoenix.sections.map(s => s.explanation.en)).size, 15);
  assert.equal(new Set(phoenix.sections.map(s => s.explanation.uk)).size, 15);
  for (const section of phoenix.sections) {
    assert.equal(section.name, null, section.id);
    assert.equal(section.confirmation_status, 'historical_numbering_unverified', section.id);
    assert.equal(section.aliases.length, 1, section.id);
    assert.ok(section.explanation.en.trim().split(/\s+/).length >= 24, section.id);
    assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 22, section.id);
    assert.equal(section.sources.length, 4, section.id);
    for (const key of section.sources) assert.match(corners.sources[key], /^https:\/\//, key);
  }
});

test('Phoenix references a period-correct 1991 layout and non-embedded map with CC BY F1DB SVG', () => {
  const asset = assets.find(a => a.layout_id === 'phoenix-2');
  assert.ok(asset);
  assert.equal(asset.author, 'Jules Roy');
  assert.equal(asset.license, 'CC-BY-4.0');
  assert.match(asset.source_url, /f1db\/f1db/);
  assert.match(corners.sources['phoenix-map'], /commons\.wikimedia\.org/);
  assert.match(corners.sources['phoenix-route-1991'], /racingcircuits\.info/);
  assert.match(corners.sources['phoenix-f1-1991'], /formula1\.com\/en\/results\/1991/);
});

test('Phoenix bilingual race stories distinguish 1990 and 1991 and remain unapproved', async () => {
  const story = narratives.entries.find(e => e.circuit_id === 'phoenix');
  assert.ok(story);
  assert.match(story.biography.text.en, /phoenix-2/);
  assert.match(story.biography.text.uk, /phoenix-2/);
  assert.deepEqual(story.moments.map(m => m.year), [1990, 1991]);
  assert.ok(story.moments.every(m => m.review_status === 'independent_review_pending'));
  assert.ok(story.moments.every(m => m.text.en.length > 100 && m.text.uk.length > 100));
  const { hasPublicationReadyCornerGuide, isCircuitEditionApproved } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  assert.equal(hasPublicationReadyCornerGuide('phoenix'), false);
  assert.equal(isCircuitEditionApproved('phoenix'), false);
});
