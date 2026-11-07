// Synthetic geometry and decisions for disposable tests; never a real publication.
const { createHash } = require('node:crypto');
const { mediaFingerprint } = require('../../../web/src/components/media/registry.ts');
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><path d="M5 5 H75 V75 H5 Z" fill="#d6bc8a"/></svg>';
function syntheticCircuitMedia(id, circuitId, localPath) {
  const asset = {
    id, subject: { type: 'circuit', id: circuitId }, kind: 'photograph', ai_generated: false,
    historical_context: { year: 1950, description: 'SYNTHETIC TEST GEOMETRY; not a photograph or a historical claim.', source_url: 'https://example.org/synthetic-context' },
    source_url: 'https://example.org/synthetic-source', file_page_url: 'https://example.org/synthetic-file',
    creator: 'SYNTHETIC TEST CREATOR', attribution: 'SYNTHETIC TEST CREATOR — test-only decision',
    license: { identifier: 'SYNTHETIC TEST LICENSE', url: 'https://example.org/synthetic-license', restrictions: ['Test data only; no rights granted.'] },
    image: { mime: 'image/svg+xml', width: 80, height: 80 }, status: 'verified', review: null,
    delivery: { local_path: localPath, remote_url: null }, source_revision: 'synthetic-v1', inspected_on: '2026-10-20',
    content_sha256: createHash('sha256').update(svg).digest('hex'), modifications: 'None (synthetic test)',
    rights_note: 'Test decision only; not human permission to use historical media.',
    alt: { en: 'Synthetic square, not historical photography', uk: 'Тестовий квадрат, а не історична фотографія' },
    caption: { en: 'SYNTHETIC MEDIA TEST — no real rights granted', uk: 'СИНТЕТИЧНЕ МЕДІАТЕСТУВАННЯ — реальних прав не надано' }, layout: null,
  };
  asset.review = { actor: 'human', reviewer: 'SYNTHETIC REVIEW FIXTURE — not a real person', reviewed_on: '2026-10-20',
    note: 'Disposable browser test only.', payload_sha256: mediaFingerprint(asset) };
  return asset;
}
function syntheticCircuitDiagram(id, circuitId, localPath, layoutId, externalRaceId) {
  const asset = syntheticCircuitMedia(id, circuitId, localPath);
  asset.kind = 'circuit-diagram';
  asset.layout = { id: layoutId, race_ids: [externalRaceId], source_url: 'https://example.org/synthetic-layout', source_revision: 'synthetic-v1' };
  asset.alt = { en: 'Synthetic diagram test geometry, not a real circuit', uk: 'Тестова геометрія схеми, а не справжня траса' };
  asset.caption = { en: 'SYNTHETIC DIAGRAM TEST — not historical geometry', uk: 'СИНТЕТИЧНИЙ ТЕСТ СХЕМИ — не історична геометрія' };
  asset.review.payload_sha256 = mediaFingerprint(asset);
  return asset;
}
module.exports = { syntheticCircuitMedia, syntheticCircuitDiagram, svg };
