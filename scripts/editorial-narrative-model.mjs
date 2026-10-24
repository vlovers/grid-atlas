// Pure structural validation for bilingual, unpublished narrative research.
const hasText = value => typeof value === 'string' && value.trim().length > 0;

export function inspectNarrativeBundle(bundle, cards) {
  const errors = [];
  const details = [];
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    return { errors: ['invalid_bundle'], details, stories: 0, chapters: 0 };
  }
  if (bundle.schema_version !== 1 || bundle.batch_id !== 'drivers-30-v1') errors.push('bundle_schema');
  if (bundle.status !== 'research_only' || bundle.publication_status !== 'unpublished' ||
      bundle.reviewer !== null || bundle.reviewed_at !== null) errors.push('publication_gate');
  if (!Array.isArray(bundle.stories) || bundle.stories.length === 0) errors.push('missing_stories');
  const seenStories = new Set();
  if (!(cards instanceof Map)) return {errors: ['invalid_card_registry'], details, stories: 0, chapters: 0};
  let chapters = 0;
  const stories = Array.isArray(bundle.stories) ? bundle.stories : [];
  for (const story of stories) {
    const id = story?.driver_id;
    if (!hasText(id) || seenStories.has(id)) errors.push('duplicate_or_missing_driver');
    else seenStories.add(id);
    const card = cards.get(id);
    if (!card || card.driver_id !== id || card.status !== 'research_only' ||
        card.publication_status !== 'unpublished') errors.push('unavailable_research_card:' + id);
    if (!Array.isArray(story?.chapters)) errors.push('invalid_chapter_collection:' + id);
    const storyChapters = Array.isArray(story?.chapters) ? story.chapters : [];
    if (storyChapters.length < 2) errors.push('insufficient_chapters:' + id);
    const knownClaims = new Map((Array.isArray(card?.claims) ? card.claims : []).filter(claim => claim && typeof claim === 'object').map(claim => [claim.claim_id, claim]));
    const seenChapters = new Set();
    for (const chapter of storyChapters) {
      chapters++;
      if (!hasText(chapter?.chapter_id) || seenChapters.has(chapter.chapter_id)) errors.push('duplicate_chapter:' + id);
      else seenChapters.add(chapter.chapter_id);
      for (const locale of ['en', 'uk']) {
        if (!hasText(chapter?.[locale]?.heading) || !hasText(chapter?.[locale]?.body) ||
            chapter[locale].body.trim().length < 80) errors.push('missing_or_short_locale:' + id + ':' + chapter?.chapter_id + ':' + locale);
      }
      if (!Array.isArray(chapter?.claim_ids)) errors.push('invalid_claim_reference_collection:' + id + ':' + chapter?.chapter_id);
      const chapterClaimIds = Array.isArray(chapter?.claim_ids) ? chapter.claim_ids : [];
      if (chapterClaimIds.length === 0 || chapterClaimIds.some(claimId => !hasText(claimId)) || new Set(chapterClaimIds).size !== chapterClaimIds.length) errors.push('invalid_claim_references:' + id + ':' + chapter?.chapter_id);
      for (const claimId of chapterClaimIds) {
        const claim = knownClaims.get(claimId);
        if (!claim) errors.push('orphan_claim:' + id + ':' + claimId);
        else if (!Array.isArray(claim.evidence) || claim.evidence.length === 0 ||
                 claim.review_status !== 'needs_review') errors.push('unlinked_claim:' + id + ':' + claimId);
      }
    }
    details.push({ driver_id: id, chapters: storyChapters.length, linked_claim_ids: [...new Set(storyChapters.flatMap(x => Array.isArray(x?.claim_ids) ? x.claim_ids : []))].length });
  }
  return { errors: [...new Set(errors)], details, stories: seenStories.size, chapters };
}
