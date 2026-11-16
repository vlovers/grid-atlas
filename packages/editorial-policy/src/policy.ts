import { canonicalJson, itemDigest } from './canonical.ts';
import {
  editorialGate, factualGate, independenceGate, localizationGate, mediaGate, schemaGate, sourceGate, technicalGate,
} from './gates.ts';
import { POLICY_VERSION, type ContentItem, type GateResult, type Outcome, type PolicyContext, type PublicationDecision, type RiskTier } from './model.ts';

/** Claim types that may never be asserted from editorial sources alone at tier A. */
const STRUCTURED_TYPES = new Set(['structured_statistic', 'date', 'layout_fact']);

/**
 * Tier A: every cited claim is structured and backed by the pinned dataset.
 * Tier C: anything quarantined (unverifiable claims, undisclosed disputes, required media without rights).
 * Tier B: everything else — editorial content that must clear the full evidence policy.
 */
export function riskTier(item: ContentItem, quarantinedClaims: readonly string[], requiredMediaBlocked: boolean): RiskTier {
  if (quarantinedClaims.length || requiredMediaBlocked) return 'C';
  const cited = new Set(item.blocks.flatMap(block => block.claim_ids));
  const claims = item.claims.filter(claim => cited.has(claim.claim_id));
  const structured = claims.length > 0 && claims.every(claim =>
    STRUCTURED_TYPES.has(claim.claim_type) && claim.evidence.some(evidence => 'dataset_ref' in evidence));
  return structured ? 'A' : 'B';
}

/**
 * Deterministic publication decision. The same item and context always produce the same
 * decision. No field written by an agent (labels, confidence, notes) can produce PASS on
 * its own: every gate re-derives its verdict from evidence and hashes.
 */
export function evaluatePublication(item: ContentItem, ctx: PolicyContext): PublicationDecision {
  const schema = schemaGate(item);
  const base = { policy_version: POLICY_VERSION, item_id: item.item_id, dataset_release: item.dataset_release, evaluated_at: ctx.evaluated_at };
  if (schema.status !== 'pass') {
    return { ...base, item_sha256: safeDigest(item), tier: 'C', outcome: 'FAIL', gates: [schema], quarantined: { claims: [], media: [] }, publishable_media: [] };
  }
  const factual = factualGate(item, ctx);
  const media = mediaGate(item, ctx);
  const gates: GateResult[] = [
    schema,
    { gate: factual.gate, status: factual.status, findings: factual.findings, warnings: factual.warnings },
    sourceGate(item),
    independenceGate(item),
    editorialGate(item, ctx),
    localizationGate(item),
    { gate: media.gate, status: media.status, findings: media.findings, warnings: media.warnings },
    technicalGate(item, ctx),
  ];
  const tier = riskTier(item, factual.quarantined, media.requiredBlocked);
  let outcome: Outcome;
  if (gates.some(gate => gate.status === 'fail')) outcome = 'FAIL';
  else if (gates.some(gate => gate.status === 'unverifiable') || tier === 'C') outcome = 'UNVERIFIABLE';
  else if (gates.some(gate => gate.status === 'pending')) outcome = 'PENDING_TECHNICAL';
  else outcome = 'PASS';
  return {
    ...base, item_sha256: itemDigest(item), tier, outcome, gates,
    quarantined: { claims: factual.quarantined, media: media.quarantined },
    publishable_media: outcome === 'PASS' ? media.publishable : [],
  };
}

function safeDigest(item: ContentItem): string {
  try { return itemDigest(item); } catch { return ''.padEnd(64, '0'); }
}

/**
 * The only entry point a publisher may use. A caller-supplied decision is never trusted:
 * the policy is re-run against the exact item, and the decision must match it field for field.
 */
export function assertPublishable(item: ContentItem, ctx: PolicyContext, claimed: PublicationDecision): PublicationDecision {
  const actual = evaluatePublication(item, { ...ctx, evaluated_at: claimed.evaluated_at });
  if (actual.outcome !== 'PASS') throw new PublicationRefused(`Policy outcome is ${actual.outcome}`, actual);
  if (canonicalJson(actual) !== canonicalJson(claimed)) throw new PublicationRefused('Supplied decision does not match the policy result for this content', actual);
  return actual;
}

export class PublicationRefused extends Error {
  readonly decision: PublicationDecision;
  constructor(message: string, decision: PublicationDecision) { super(message); this.name = 'PublicationRefused'; this.decision = decision; }
}
