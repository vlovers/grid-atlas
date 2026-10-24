import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const graph = readFileSync('apps/web/src/components/editorial/record-graphic.module.css', 'utf8');
const graphComponent = readFileSync('apps/web/src/components/editorial/record-graphic.tsx', 'utf8');
const mediaCss = readFileSync('apps/web/src/components/media/media.module.css', 'utf8');
const gallery = readFileSync('apps/web/src/components/media/collection.module.css', 'utf8');
const publication = JSON.parse(readFileSync('apps/web/src/components/media/publication.json', 'utf8'));

test('data graphic keeps source-driven chart and accessible label with progressive motion', () => {
  assert.match(graphComponent, /sorted\.map\(row =>/);
  assert.match(graphComponent, /aria-label=\{label\}/);
  assert.match(graphComponent, /<desc>/);
  assert.match(graph, /@keyframes record-bar-reveal/);
  assert.match(graph, /transform-origin: center bottom/);
  assert.match(graph, /prefers-reduced-motion: reduce/);
  assert.match(graph, /animation: none/);
});

test('empty imagery gets a decorative treatment but no unapproved asset publication', () => {
  assert.match(gallery, /\.empty::before/);
  assert.match(gallery, /pointer-events: none/);
  assert.match(gallery, /forced-colors: active/);
  assert.equal(publication.lane, 'publication');
  assert.deepEqual(publication.assets, []);
});

test('approved-media gallery layout stays responsive and optional', () => {
  assert.match(gallery, /grid-template-columns: repeat\(auto-fit/);
  assert.match(gallery, /\.gallery:has\(> :nth-child\(3\)\)/);
  assert.match(gallery, /@media \(hover: hover\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(gallery, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(gallery, /transition: none/);
});

test('reviewed real photos reveal progressively while motion opt-out is respected', () => {
  assert.match(mediaCss, /@keyframes reviewed-image-appear/);
  assert.match(mediaCss, /prefers-reduced-motion: no-preference/);
  assert.match(mediaCss, /prefers-reduced-motion: reduce/);
  assert.match(mediaCss, /animation: none/);
  assert.match(mediaCss, /object-fit: contain/);
});
