import { createHash } from 'node:crypto';
import type { Claim, ContentItem, SourceSnapshot } from './model.ts';

/** Deterministic JSON: object keys sorted recursively, undefined dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * Digest of what a claim asserts and the exact bytes it cites, excluding its verification
 * record. Swapping a cited snapshot for different text changes it, so a verification cannot
 * outlive the evidence it was made against.
 */
export function claimDigest(claim: Claim, sources: readonly SourceSnapshot[]): string {
  const cited = new Set((claim.evidence ?? []).flatMap(e => ('source_id' in e ? [e.source_id] : [])));
  const snapshots = sources.filter(s => cited.has(s.source_id)).map(s => ({ source_id: s.source_id, content_sha256: s.content_sha256 }))
    .sort((a, b) => (a.source_id < b.source_id ? -1 : 1));
  return sha256(canonicalJson({ claim: { ...claim, verification: undefined }, snapshots }));
}

/**
 * Digest of the publishable content. Reviews, verifications and receipts bind to this
 * value, so it excludes them (otherwise binding would be circular) — but any change to
 * text, claims, cited evidence, source bytes or media changes it and invalidates them.
 */
export function itemDigest(item: ContentItem): string {
  return sha256(canonicalJson({
    item_id: item.item_id,
    entity: item.entity,
    dataset_release: item.dataset_release,
    blocks: item.blocks,
    claims: item.claims.map(claim => ({ ...claim, verification: undefined })),
    // Source bytes are bound through content_sha256; the text itself is not re-hashed here.
    sources: item.sources.map(source => ({ ...source, text: undefined })),
    media: item.media,
  }));
}
