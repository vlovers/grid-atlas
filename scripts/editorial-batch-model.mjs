// Pure, read-only validation of unpublished bilingual research cards.
export function safeHttpsUrl(value) {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}
const text = value => typeof value === 'string' && value.trim().length > 0;
export function inspectResearchCard(card, expectedId) {
  const errors = [], warnings = [];
  if (!card || typeof card !== 'object' || Array.isArray(card)) return {errors:['invalid_document'],warnings,claims:0,linkedClaims:0,completeEvidenceClaims:0};
  if (card.schema_version !== 1) errors.push('schema_version');
  if (card.driver_id !== expectedId) errors.push('driver_id');
  if (card.status !== 'research_only' || card.publication_status !== 'unpublished' || card.reviewer !== null || card.reviewed_at !== null) errors.push('publication_gate');
  if (!safeHttpsUrl(card.source?.url)) errors.push('source_url');
  if (!text(card.source?.publisher) || !text(card.source?.independence_group) || !text(card.source?.accessed_on)) errors.push('source_metadata');
  if (!Array.isArray(card.media) || card.media.length !== 0) errors.push('unapproved_media');
  if (!Array.isArray(card.gaps) || card.gaps.length === 0) warnings.push('unrecorded_gaps');
  const claims = Array.isArray(card.claims) ? card.claims : [];
  if (!Array.isArray(card.claims) || claims.length === 0) errors.push('missing_claims');
  const ids = new Set();
  let linkedClaims = 0, completeEvidenceClaims = 0;
  for (const claim of claims) {
    if (!text(claim?.claim_id) || ids.has(claim.claim_id)) errors.push('duplicate_or_missing_claim_id');
    else ids.add(claim.claim_id);
    if (!text(claim?.en) || !text(claim?.uk)) errors.push('missing_translation');
    if (claim?.review_status !== 'needs_review') errors.push('review_state');
    const evidence = claim?.evidence;
    if (!Array.isArray(evidence) || evidence.length === 0) { warnings.push('missing_claim_evidence:'+claim?.claim_id); continue; }
    linkedClaims++;
    const valid = evidence.every(item => safeHttpsUrl(item?.source_url) && text(item?.locator) && item.locator.trim().length >= 16 && item.supports === true && item.source_url === card.source?.url);
    if (!valid) errors.push('invalid_claim_evidence:'+claim?.claim_id);
    else completeEvidenceClaims++;
  }
  return {errors:[...new Set(errors)],warnings,claims:claims.length,linkedClaims,completeEvidenceClaims};
}
export function summarizeCoverage(rows) {
  return {
    candidates:rows.length,
    existing_bilingual_drafts:rows.filter(x=>x.kind==='existing_pilot' && x.claim_id_parity===true).length,
    research_drafts:rows.filter(x=>x.kind==='research_draft').length,
    missing:rows.filter(x=>x.kind==='missing').length,
    invalid:rows.filter(x=>x.errors?.length).length,
    english_claims:rows.reduce((n,x)=>n+(x.locales.en.claims??0),0),
    ukrainian_claims:rows.reduce((n,x)=>n+(x.locales.uk.claims??0),0),
    research_claims_with_evidence:rows.reduce((n,x)=>n+(x.completeEvidenceClaims??0),0),
    research_claims_without_evidence:rows.reduce((n,x)=>n+(x.researchClaims??0)-(x.completeEvidenceClaims??0),0),
    approved_for_publication:0
  };
}
