import publication from '@/components/media/publication.json';
import type { MediaAsset } from '@/components/media/registry';

/**
 * Curated editorial media only. A filename or a Commons page URL is not proof of
 * reuse permission. Review each asset and its attribution before adding it here.
 *
 * Public assets must be stored locally at /media/editorial/<filename>, with
 * a provenance record in docs/editorial/MEDIA-PROVENANCE.md.
 */
export type EditorialPhoto = {
  src: `/media/editorial/${string}`;
  alt: { en: string; uk: string };
  caption: { en: string; uk: string };
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  changes: string;
};

export const editorialPhotos: Partial<Record<string, EditorialPhoto>> = {};

/** Only display media with a complete human-reviewed provenance record. */
export function approvedEditorialPhoto(slug: string): EditorialPhoto | null {
  const photo = editorialPhotos[slug];
  if (!photo) return null;
  const published = (publication.assets as MediaAsset[]).find(asset =>
    asset.status === 'verified' && asset.delivery.local_path === photo.src &&
    asset.review?.actor === 'human' && asset.content_sha256 &&
    asset.creator === photo.creator && asset.file_page_url === photo.sourceUrl &&
    asset.license.identifier === photo.license && asset.license.url === photo.licenseUrl
  );
  if (!published) return null;
  if (!photo.src.startsWith('/media/editorial/') || !photo.alt.en || !photo.alt.uk ||
      !photo.caption.en || !photo.caption.uk || !photo.creator ||
      !photo.sourceUrl.startsWith('https://') || !photo.license ||
      !photo.licenseUrl.startsWith('https://') || !photo.changes) return null;
  return photo;
}
