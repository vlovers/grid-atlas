import { candidateHistoricalCornerReviewQueue } from './circuit-candidates.ts';

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
