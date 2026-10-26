/** AI-reviewed story releases are independent from the human-approved driver-dossier DB pipeline.
 * No entry is publishable until both language manuscripts have fixed review hashes. */
import { createHash } from 'node:crypto';
import { draftArticle } from './editorial-draft-articles';
import { editorialStoryPreviews } from './editorial-previews';

type ReviewedEdition = {
  slug: string;
  enSha256: string;
  ukSha256: string;
  evidenceRevision: string;
  reviewRevision: string;
  reviewedAt: string;
};

// This registry is intentionally empty until full EN/UK manuscript review and release checks.
export const reviewedEditions: readonly ReviewedEdition[] = [
  {
    "slug": "lauda-hunt-1976",
    "enSha256": "786905321f442afa0738375eca73b6a3e3121470d7306e5298dea813f7fe34bb",
    "ukSha256": "d5f64a7ffc046d1ae800e746ec6d4342406a136e5aabf281a8e0dae319da8530",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "senna-prost-1988-89",
    "enSha256": "f7a47ca794a98742a84ab3277cd6bbd9ee7cf9957a8bcceb166989cfcff831d4",
    "ukSha256": "ae133278d2fbaa6e93f895c2733bbb5b62047581d0a33e4b5455c35ce31baeb4",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "villeneuve-arnoux-1979",
    "enSha256": "6b3ebbfd15efb3e37aa9ad4b50774b690e5c80ad9cced915fc1a98177df1c033",
    "ukSha256": "fe7dba868de45b606d75852e678729e7bcc78ef870accc85ef248c672f310c5d",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "vettel-monza-2008",
    "enSha256": "30f99d8a176fc9967188773495d3e929bd503e42d3daa0c752049491ff02a0e0",
    "ukSha256": "5451655cd595fa1d51912116687cf8cd241c3ee20379818b0fd64ffbe390267e",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "button-canada-2011",
    "enSha256": "e69307f8d040f1d39b7bdb4d8e2a01bdc9b1080461e7c0dc7d26ea1d71858f19",
    "ukSha256": "0a2543d9900d1d9274928ea3d09b7b702d2e8ab4e0f8831e7a25557d11088966",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "perez-sakhir-2020",
    "enSha256": "0797f4cb57e43c2d3c6ddccb823ae1053c3f36079ea9a7383b4f79729881e47c",
    "ukSha256": "e04d1a13ff2c8b9f0d4057ecdbfd03d8518c4d966e20897ad87edd612e94dfde",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "kubica-bmw-2008",
    "enSha256": "ac8107bc33a9e2b11dbe54446806b2d2f98ab5da37aa80baaac574fa04718062",
    "ukSha256": "a26ccaf287022c893e59191bcf3a1e09ac08257bf04cb254c29520b82028f26a",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "schumacher-ferrari-1996-2000",
    "enSha256": "388439522f9b337c7833271d570e52bb7ecc47c75ceba11e6413d7681a62a539",
    "ukSha256": "ca31a47a36734b0f1a082e052ab787f90541d2ee4a07f69d7d805d4b00147082",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "massa-2008",
    "enSha256": "0ca7fb5a96657497a3805ae8d2ebae1d8541d831b057463d3493ac8f88b0d1f1",
    "ukSha256": "9505c236bccc25f3d9b46ef4516409aa6eb1f6778e261b9715184c5dfa2e6908",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  },
  {
    "slug": "brawn-2009",
    "enSha256": "f37dccb8cfa4982ea4a0fc4ed37165ae0464b739caa116e32d7a969a7cc2fe27",
    "ukSha256": "918325fe76fffc9a045fd86e94963c72dbe6e0e24fb891e5a37f0d3968069424",
    "evidenceRevision": "182b74fc8e03a541302f4f3b4f49cbb1adaab633",
    "reviewRevision": "219079fa04c5ee49d2c304e5d0ff8b716c66b5cd",
    "reviewedAt": "2026-10-26"
  }
];

export function editionDigest(slug: string, locale: 'en' | 'uk'): string | null {
  const chapters = draftArticle(slug, locale);
  const preview = editorialStoryPreviews.find(item => item.slug === slug);
  return chapters && preview
    ? createHash('sha256').update(JSON.stringify({ chapters, title: preview[locale].title, summary: preview[locale].summary })).digest('hex')
    : null;
}

export function isAiReviewedStory(slug: string): boolean {
  const edition = reviewedEditions.find(item => item.slug === slug);
  if (!edition || !edition.reviewRevision || !edition.evidenceRevision || !edition.reviewedAt) return false;
  const valid = (hash: string) => /^[a-f0-9]{64}$/.test(hash);
  return valid(edition.enSha256) && valid(edition.ukSha256) &&
    edition.enSha256 === editionDigest(slug, 'en') &&
    edition.ukSha256 === editionDigest(slug, 'uk');
}
