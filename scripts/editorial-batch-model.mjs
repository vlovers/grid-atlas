// Pure, read-only validation of unpublished bilingual research cards.
export function safeHttpsUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}


// Prevent publisher impersonation from inflating independent-source coverage.
// This is a metadata consistency check, not a live source verification.
export function sourcePublisherMismatch(source) {
  if (!safeHttpsUrl(source?.url)) return false;
  const host = new URL(source.url).hostname.toLowerCase();
  const official = host === 'fia.com' || host.endsWith('.fia.com') ? 'fia'
    : host === 'formula1.com' || host.endsWith('.formula1.com') ? 'formula1'
    : null;
  if (official === 'fia') return source.publisher !== 'FIA' || source.independence_group !== 'fia';
  if (official === 'formula1') return source.publisher !== 'Formula 1' || source.independence_group !== 'formula1';
  return source.independence_group === 'fia' || source.independence_group === 'formula1';
}

const hasText = value => typeof value === 'string' && value.trim().length > 0;

export function inspectResearchCard(card, expectedId) {
  const errors = [];
  const warnings = [];
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    return { errors: ['invalid_document'], warnings, claims: 0, linkedClaims: 0, completeEvidenceClaims: 0, corroboratedClaims: 0 };
  }

  if (card.schema_version !== 1) errors.push('schema_version');
  if (card.driver_id !== expectedId) errors.push('driver_id');
  if (card.status !== 'research_only' || card.publication_status !== 'unpublished' ||
      card.reviewer !== null || card.reviewed_at !== null) errors.push('publication_gate');
  if (!safeHttpsUrl(card.source?.url)) errors.push('source_url');
  if (sourcePublisherMismatch(card.source)) errors.push('source_publisher_identity');
  if (!hasText(card.source?.publisher) || !hasText(card.source?.independence_group) ||
      !hasText(card.source?.accessed_on)) errors.push('source_metadata');
  if (!Array.isArray(card.media) || card.media.length !== 0) errors.push('unapproved_media');
  if (!Array.isArray(card.gaps) || card.gaps.length === 0) warnings.push('unrecorded_gaps');

  // Additional pages are explicitly declared. They are not independent corroboration
  // merely because their URL differs: publisher independence_group is authoritative.
  const sourceRegistry = new Map();
  if (safeHttpsUrl(card.source?.url)) sourceRegistry.set(card.source.url, card.source);
  const extraSources = card.additional_sources ?? [];
  if (!Array.isArray(extraSources)) errors.push('additional_sources_schema');
  else for (const source of extraSources) {
    if (!safeHttpsUrl(source?.url) || !hasText(source?.publisher) ||
        !hasText(source?.independence_group) || !hasText(source?.accessed_on) ||
        !hasText(source?.title)) {
      errors.push('additional_source_metadata');
      continue;
    }
    if (sourcePublisherMismatch(source)) errors.push('additional_source_publisher_identity');
    if (sourceRegistry.has(source.url)) errors.push('duplicate_source_url');
    else sourceRegistry.set(source.url, source);
  }

  const claims = Array.isArray(card.claims) ? card.claims : [];
  if (!Array.isArray(card.claims) || claims.length === 0) errors.push('missing_claims');
  const ids = new Set();
  let linkedClaims = 0;
  let completeEvidenceClaims = 0;
  let corroboratedClaims = 0;
  for (const claim of claims) {
    if (!hasText(claim?.claim_id) || ids.has(claim.claim_id)) errors.push('duplicate_or_missing_claim_id');
    else ids.add(claim.claim_id);
    if (!hasText(claim?.en) || !hasText(claim?.uk)) errors.push('missing_translation');
    if (claim?.review_status !== 'needs_review') errors.push('review_state');

    const evidence = claim?.evidence;
    if (!Array.isArray(evidence) || evidence.length === 0) {
      warnings.push('missing_claim_evidence:' + claim?.claim_id);
      continue;
    }
    linkedClaims++;
    const valid = evidence.every(item => sourceRegistry.has(item?.source_url) &&
      hasText(item?.locator) && item.locator.trim().length >= 16 && item.supports === true);
    if (!valid) {
      errors.push('invalid_claim_evidence:' + claim?.claim_id);
      continue;
    }
    // A repeated citation is not an additional piece of evidence. Fail closed
    // instead of allowing a copied locator to inflate source coverage.
    const evidenceKeys = evidence.map(item => [
      item.source_url,
      item.locator.trim().replace(/\s+/g, ' ').toLowerCase()
    ].join('::'));
    if (new Set(evidenceKeys).size !== evidenceKeys.length) {
      errors.push('duplicate_claim_evidence:' + claim.claim_id);
      continue;
    }
    completeEvidenceClaims++;
    const groups = new Set(evidence.map(item => sourceRegistry.get(item.source_url).independence_group));
    if (groups.size >= 2) corroboratedClaims++;
  }
  return {
    errors: [...new Set(errors)], warnings, claims: claims.length,
    linkedClaims, completeEvidenceClaims, corroboratedClaims
  };
}

export function summarizeCoverage(rows) {
  return {
    candidates: rows.length,
    existing_bilingual_drafts: rows.filter(x => x.kind === 'existing_pilot' && x.claim_id_parity === true).length,
    research_drafts: rows.filter(x => x.kind === 'research_draft').length,
    missing: rows.filter(x => x.kind === 'missing').length,
    invalid: rows.filter(x => x.errors?.length).length,
    english_claims: rows.reduce((n, x) => n + (x.locales.en.claims ?? 0), 0),
    ukrainian_claims: rows.reduce((n, x) => n + (x.locales.uk.claims ?? 0), 0),
    research_claims_with_evidence: rows.reduce((n, x) => n + (x.completeEvidenceClaims ?? 0), 0),
    research_claims_without_evidence: rows.reduce((n, x) => n + (x.researchClaims ?? 0) - (x.completeEvidenceClaims ?? 0), 0),
    research_claims_with_independent_corroboration: rows.reduce((n, x) => n + (x.corroboratedClaims ?? 0), 0),
    approved_for_publication: 0
  };
}
