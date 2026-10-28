// All approval/rights fields here are synthetic test data, never publication records.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mediaFingerprint, type MediaAsset } from '../registry';

export function syntheticAsset(variant: string): MediaAsset {
  const asset: MediaAsset = {
    id: 'synthetic-diagram', subject: { type: 'circuit', id: 'fixture-circuit' }, kind: 'circuit-diagram',
    ai_generated: false, historical_context: { year: 1950, description: 'Synthetic test context, not history.', source_url: 'https://example.org/test-context' },
    source_url: 'https://example.org/test-source', file_page_url: 'https://example.org/test-file',
    creator: 'Synthetic Fixture Creator', attribution: 'Synthetic Fixture Creator — test data only',
    license: { identifier: 'Synthetic license fixture', url: 'https://example.org/test-license', restrictions: ['Synthetic rights data; not permission to reuse real media.'] },
    image: { mime: 'image/svg+xml', width: 500, height: 500 }, status: 'verified', review: null,
    delivery: { local_path: variant === 'missing' ? '/media/missing.svg' : '/media/fixture.svg', remote_url: null },
    source_revision: 'synthetic-v1', inspected_on: '2026-10-20',
    content_sha256: createHash('sha256').update(readFileSync(join(process.cwd(), 'public/media/fixture.svg'))).digest('hex'),
    modifications: 'None (synthetic fixture)', rights_note: 'Test-only data; no historical-media approval is asserted.',
    alt: { en: 'Crossed square test geometry, not a real circuit', uk: 'Перекреслений квадрат для тесту, а не справжня траса' },
    caption: { en: 'Synthetic diagram: not a real circuit.', uk: 'Тестова схема: не є справжньою трасою.' },
    layout: { id: 'fixture-layout', race_ids: ['fixture-race'], source_url: 'https://example.org/test-mapping', source_revision: 'synthetic-v1' },
  };
  asset.review = { actor: 'human', reviewer: 'SYNTHETIC REVIEW FIXTURE — not a real person', reviewed_on: '2026-10-20',
    note: 'Synthetic approval exercises the display gate only.', payload_sha256: mediaFingerprint(asset) };
  if (variant === 'withdrawn') asset.status = 'withdrawn';
  return asset;
}

export function syntheticCollectionAsset(variant: string): MediaAsset {
  const asset=syntheticAsset('verified');
  const illustration=variant==='gallery-car'||variant==='gallery-ai';
  asset.id='synthetic-collection';
  asset.subject={type:illustration?'constructor':'driver',id:'fixture-subject'};
  asset.kind=illustration?'car-illustration':'portrait';
  asset.ai_generated=variant==='gallery-ai';
  asset.layout=null;
  asset.review!.payload_sha256=mediaFingerprint(asset);
  if(variant==='gallery-withdrawn')asset.status='withdrawn';
  if(variant==='gallery-stale')asset.caption.en='Changed synthetic caption without re-review';
  return asset;
}

export function syntheticContactSheet(): MediaAsset[] {
  return Array.from({ length: 11 }, (_, index) => {
    const asset = syntheticCollectionAsset('gallery-verified');
    asset.id = `synthetic-frame-${index + 1}`;
    asset.alt = { en: `Synthetic geometry, frame ${index + 1}`, uk: `Тестова геометрія, кадр ${index + 1}` };
    asset.caption = { en: `Synthetic frame ${index + 1}. Not historical photography.`, uk: `Тестовий кадр ${index + 1}. Не історична фотографія.` };
    if (index >= 8) asset.delivery.local_path = `/media/forbidden-${index}.svg`;
    asset.review!.payload_sha256 = mediaFingerprint(asset);
    if (index === 8) asset.status = 'rejected';
    if (index === 9) asset.status = 'withdrawn';
    if (index === 10) asset.caption.en = 'Changed after review';
    return asset;
  });
}
