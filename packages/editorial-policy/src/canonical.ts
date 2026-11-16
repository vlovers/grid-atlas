import { createHash } from 'node:crypto';
import type { Claim, ContentItem } from './model.ts';

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

/** Digest of what a claim asserts and cites, excluding its verification record. */
export function claimDigest(claim: Claim): string {
  return sha256(canonicalJson({ ...claim, verification: undefined }));
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
