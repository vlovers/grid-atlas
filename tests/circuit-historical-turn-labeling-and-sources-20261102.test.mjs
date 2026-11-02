import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../apps/web/src/components/editorial/', import.meta.url);
const data = JSON.parse(readFileSync(new URL('circuit-corners-v3.json', root), 'utf8'));
const artwork = JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json', import.meta.url), 'utf8'));
const component = readFileSync(new URL('circuit-corner-guide.tsx', root), 'utf8');

const historic = data.guides.filter(guide =>
  guide.sections.some(section => !['source_checked_ai', 'independently_verified'].includes(section.confirmation_status))
);

test('historical candidate numbering stays explicitly provisional, including AI-mapped named corners', () => {
  assert.ok(historic.length >= 4, 'expected historic research guides');
  for (const guide of historic) {
    assert.equal(guide.review_status, 'independent_review_pending', guide.circuit_id);
    assert.ok(guide.numbering_basis?.length > 20, guide.circuit_id);
    assert.ok(guide.sections.length > 0, guide.circuit_id);
    assert.equal(guide.sections.flatMap(section => section.numbers).length, guide.numbered_turns, guide.circuit_id);
  }
  for (const id of ['brands-hatch', 'donington', 'estoril', 'watkins-glen']) {
    const guide = historic.find(guide => guide.circuit_id === id);
    assert.ok(guide, id + ' must remain provisional even when it has named landmarks');
    assert.ok(guide.sections.some(section => section.name), id);
  }
  assert.match(component, /!\['source_checked_ai', 'independently_verified'\]\.includes\(section\.confirmation_status\)/);
  assert.match(component, /provisional study positions — not verified turn numbers/);
  assert.match(component, /Comparative landmarks, not verified corner names/);
  assert.match(component, /not authenticated historical apex numbers or locations/);
});

test('historical candidate links never render undefined hrefs or claim an FIA numbered map', () => {
  assert.match(component, /layoutReference && <a/);
  assert.match(component, /hasFiaMap && !provisionalNumbering/);
  assert.match(component, /Historical source \(not number verification\)/);
  assert.doesNotMatch(component, /href=\{mapSource\}/);
  assert.doesNotMatch(component, /href=\{cornerSources\[section\.sources\[1\]\]\}/);
  for (const guide of data.guides) {
    for (const section of guide.sections) {
      assert.ok(section.sources.length >= 1, section.id);
      assert.ok(section.sources.some(key => /^https:\/\//.test(data.sources[key] ?? '')), section.id);
      assert.ok(section.explanation?.en?.trim() && section.explanation?.uk?.trim(), section.id);
    }
  }
});

test('historical outlines retain pinned F1DB attribution, not implied FIA-image rights', () => {
  const byId = new Map(artwork.map(asset => [asset.layout_id, asset]));
  for (const guide of historic) {
    const asset = byId.get(guide.layout_id);
    assert.ok(asset, guide.layout_id);
    assert.equal(asset.author, 'Jules Roy', guide.layout_id);
    assert.equal(asset.license, 'CC-BY-4.0', guide.layout_id);
    assert.match(asset.source_url, /github\.com\/f1db\/f1db/);
    assert.ok(!guide.diagram, guide.circuit_id + ': no invented numbered diagram');
  }
});
