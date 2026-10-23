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
  asset.id='synthetic-collection';
  asset.subject={type:variant==='gallery-car'?'constructor':'driver',id:'fixture-subject'};
  asset.kind=variant==='gallery-car'?'car-illustration':'portrait';
  asset.layout=null;
  asset.review!.payload_sha256=mediaFingerprint(asset);
  if(variant==='gallery-withdrawn')asset.status='withdrawn';
  if(variant==='gallery-stale')asset.caption.en='Changed synthetic caption without re-review';
  return asset;
}
