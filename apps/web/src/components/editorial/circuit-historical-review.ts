import { candidateHistoricalCornerReviewQueue, candidateUnnumberedHistoricalRoutes } from './circuit-candidates.ts';
import { historicalCornerCountReviewByCircuit } from './circuit-historical-counts.ts';

/** Research-only claim triage; a located passage is not an FIA apex receipt. */
export const historicalCornerClaimTriage = candidateHistoricalCornerReviewQueue.map(claim => {
  const pinpointPresent = typeof claim.source_locator === 'string' &&
    claim.source_locator.trim().length >= 30;
  return {
    review_id: claim.review_id,
    circuit_id: claim.circuit_id,
    layout_id: claim.layout_id,
    research_kind: claim.research_kind,
    label: claim.label,
    source_locator: claim.source_locator,
    source_locator_gap: 'source_locator_gap' in claim ? claim.source_locator_gap : null,
    pinpoint_status: pinpointPresent
      ? 'claim_passage_identified_unreviewed' as const
      : 'claim_specific_passage_missing' as const,
    next_action: pinpointPresent
      ? 'authenticate_period_numbered_map_and_independently_review_apex_crosswalk' as const
      : 'find_claim_passage_then_authenticate_period_numbered_map' as const,
    numbered_apex_verified: false as const,
    publication_allowed: false as const,
    media_rights_approved: false as const,
  };
});

export const historicalCornerClaimTriageByCircuit = [
  'ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring',
].map(circuit_id => {
  const claims = historicalCornerClaimTriage.filter(claim => claim.circuit_id === circuit_id);
  return {
    circuit_id,
    total_claims: claims.length,
    period_bends: claims.filter(claim => claim.research_kind === 'period_bend').length,
    named_features: claims.filter(claim => claim.research_kind === 'named_feature').length,
    claim_passages_identified: claims.filter(claim =>
      claim.pinpoint_status === 'claim_passage_identified_unreviewed').length,
    claim_passages_missing: claims.filter(claim =>
      claim.pinpoint_status === 'claim_specific_passage_missing').length,
    independently_verified_numbered_apexes: 0,
    publication_allowed: false as const,
  };
});

/**
 * An internal, bilingual worklist for every historic claim. A located passage
 * attests only what its source actually says; it is not a numbered-map receipt.
 * The geometry and image-rights gates remain explicitly closed for all 66.
 */
export const historicalCornerEvidenceWorklist = historicalCornerClaimTriage.map(claim => {
  const original = candidateHistoricalCornerReviewQueue.find(item => item.review_id === claim.review_id)!;
  const route = candidateUnnumberedHistoricalRoutes.find(item => item.circuit_id === claim.circuit_id)!;
  const passageMissing = claim.pinpoint_status === 'claim_specific_passage_missing';
  const complexGeometry = original.feature_kind !== 'single_bend';
  // Keep the original claim-specific bilingual evidence gap. A generic P1
  // instruction loses the distinction between the 15 Dallas diagram inferences.
  const gap = passageMissing && original.source_locator_gap &&
    typeof original.source_locator_gap === 'object' &&
    'en' in original.source_locator_gap && 'uk' in original.source_locator_gap
    ? {
      en: String(original.source_locator_gap.en),
      uk: String(original.source_locator_gap.uk),
    }
    : null;
  return {
    ...claim,
    historical_period: route.period,
    geometry_scope: original.feature_kind,
    source_roles: original.source_roles,
    source_passage_found: !passageMissing,
    claim_specific_source_gap: gap,
    // A located locator is not proof that the passage was independently authenticated.
    source_passage_independently_authenticated: false as const,
    numbered_map_crosswalk_verified: false as const,
    geometric_anchor_verified: false as const,
    independent_human_review_completed: false as const,
    media_policy: route.media_rights?.external_reference_only === true &&
      route.media_rights?.third_party_map_reuse_approved === false &&
      route.media_rights?.third_party_photo_reuse_approved === false
      ? 'external_links_only_no_media_reuse' as const
      : 'media_rights_unresolved' as const,
    priority: passageMissing ? 'P1_find_claim_passage' as const
      : complexGeometry ? 'P2_disambiguate_complex_or_sector' as const
      : 'P3_crosswalk_single_bend' as const,
    review_request: passageMissing ? {
      en: (gap?.en ?? 'Locate the claim-specific source passage.') + ' Then obtain a dated numbered map for the exact historical layout. Do not publish or copy third-party media.',
      uk: (gap?.uk ?? 'Знайти уривок джерела саме для цього твердження.') + ' Потім отримати датовану нумеровану схему точної історичної конфігурації. Не публікувати й не копіювати сторонні медіа.',
    } : complexGeometry ? {
      en: 'Confirm whether the historic name or description denotes a complex, sector or several bends before mapping any individual apex. Obtain an independently reviewed period numbered chart.',
      uk: 'Уточнити, чи історична назва або опис означає зв’язку, сектор або кілька поворотів, перш ніж прив’язувати окремі апекси. Потрібна незалежно перевірена нумерована схема епохи.',
    } : {
      en: 'Cross-check the described single bend against a dated numbered chart of this exact period layout and obtain independent human review; the passage alone is insufficient.',
      uk: 'Зіставити описаний окремий поворот із датованою нумерованою схемою саме цієї конфігурації та провести незалежну людську перевірку; самого уривка недостатньо.',
    },
  };
});

export const historicalCornerEvidenceWorklistByCircuit = historicalCornerClaimTriageByCircuit.map(circuit => {
  const claims = historicalCornerEvidenceWorklist.filter(item => item.circuit_id === circuit.circuit_id);
  const countReview = historicalCornerCountReviewByCircuit.find(item => item.circuit_id === circuit.circuit_id)!;
  return {
    ...circuit,
    corner_count_reconciliation: countReview,
    historical_period: claims[0]?.historical_period ?? null,
    priority_1_missing_passage: claims.filter(item => item.priority === 'P1_find_claim_passage').length,
    priority_1_with_bilingual_specific_gaps: claims.filter(item =>
      item.priority === 'P1_find_claim_passage' &&
      Boolean(item.claim_specific_source_gap?.en && item.claim_specific_source_gap?.uk)).length,
    priority_2_complex_geometry: claims.filter(item => item.priority === 'P2_disambiguate_complex_or_sector').length,
    priority_3_single_bend_crosswalk: claims.filter(item => item.priority === 'P3_crosswalk_single_bend').length,
    media_rights_approved: false as const,
    dated_numbered_map_crosswalks_verified: 0,
  };
});
