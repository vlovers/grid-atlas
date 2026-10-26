/** AI-reviewed story releases are independent from the human-approved driver-dossier DB pipeline.
 * No entry is publishable until both language manuscripts have fixed review hashes. */
import { createHash } from 'node:crypto';
import { draftArticle } from './editorial-draft-articles';

type ReviewedEdition = {
  slug: string;
  enSha256: string;
  ukSha256: string;
  evidenceRevision: string;
  reviewRevision: string;
  reviewedAt: string;
};

// This registry is intentionally empty until full EN/UK manuscript review and release checks.
export const reviewedEditions: readonly ReviewedEdition[] = [];

export function editionDigest(slug: string, locale: 'en' | 'uk'): string | null {
  const chapters = draftArticle(slug, locale);
  return chapters ? createHash('sha256').update(JSON.stringify(chapters)).digest('hex') : null;
}

export function isAiReviewedStory(slug: string): boolean {
  const edition = reviewedEditions.find(item => item.slug === slug);
  if (!edition || !edition.reviewRevision || !edition.evidenceRevision || !edition.reviewedAt) return false;
  const valid = (hash: string) => /^[a-f0-9]{64}$/.test(hash);
  return valid(edition.enSha256) && valid(edition.ukSha256) &&
    edition.enSha256 === editionDigest(slug, 'en') &&
    edition.ukSha256 === editionDigest(slug, 'uk');
}
