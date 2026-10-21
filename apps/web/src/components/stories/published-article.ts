/** Public evidence projection, never a dossier/review file or a client approval gate. */
export type ArticleEvidence = { url: string; title: string; publisher: string; author: string | null; accessed_on: string; locator: string };
export type PublishedArticle = {
  id: string; locale: 'uk' | 'en'; slug: string; title: string; body_markdown: string; published_at: string;
  references: { url: string; title: string; publisher: string }[];
  claims: { id: string; statement: string; evidence: ArticleEvidence[] }[];
  sections: { heading: string; claim_ids: string[] }[];
};
const text = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
function https(x: unknown): x is string {
  if (!text(x)) return false;
  try { const url = new URL(x); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
/** Reject malformed projections rather than displaying prose without traceable evidence. */
export function parsePublishedArticle(value: unknown, locale: 'en' | 'uk'): PublishedArticle {
  if (!object(value) || !text(value.id) || value.locale !== locale || !text(value.slug) || !text(value.title) ||
    !text(value.body_markdown) || !text(value.published_at) || !Number.isFinite(Date.parse(value.published_at)) ||
    !Array.isArray(value.claims) || !value.claims.length || !Array.isArray(value.sections) || !value.sections.length || !Array.isArray(value.references)) throw new Error('Malformed editorial article');
  const ids = new Set<string>();
  for (const claim of value.claims) {
    if (!object(claim) || !text(claim.id) || ids.has(claim.id) || !text(claim.statement) || !Array.isArray(claim.evidence) || !claim.evidence.length) throw new Error('Malformed editorial claim');
    ids.add(claim.id);
    for (const e of claim.evidence) if (!object(e) || !https(e.url) || !text(e.title) || !text(e.publisher) || !text(e.locator) ||
      !text(e.accessed_on) || !/^\d{4}-\d{2}-\d{2}$/.test(e.accessed_on) || !(e.author === null || text(e.author))) throw new Error('Malformed editorial evidence');
  }
  const used = new Set<string>();
  for (const section of value.sections) {
    if (!object(section) || typeof section.heading !== 'string' || !Array.isArray(section.claim_ids) || !section.claim_ids.length) throw new Error('Malformed editorial section');
    for (const id of section.claim_ids) {
      if (!text(id) || !ids.has(id) || used.has(id)) throw new Error('Malformed editorial coverage');
      used.add(id);
    }
  }
  if (used.size !== ids.size || value.references.some(r => !object(r) || !https(r.url) || !text(r.title) || !text(r.publisher))) throw new Error('Malformed editorial coverage');
  return value as PublishedArticle;
}
