import type { PublishedArticle } from '../stories/published-article';

/** Order only server-approved claim IDs; never turn unreviewed Markdown into HTML. */
export function circuitArticleSections(article: PublishedArticle) {
  const claims = new Map(article.claims.map(claim => [claim.id, claim]));
  if (claims.size !== article.claims.length || !claims.size) throw new Error('Invalid circuit claims');
  const used = new Set<string>();
  const sections = article.sections.map(section => {
    if (!section.claim_ids.length) throw new Error('Empty circuit section');
    const resolved = section.claim_ids.map(id => {
      const claim = claims.get(id);
      if (!claim || used.has(id)) throw new Error('Invalid circuit claim reference');
      used.add(id);
      return claim;
    });
    return { heading: section.heading, claims: resolved };
  });
  if (!sections.length || used.size !== claims.size) throw new Error('Incomplete circuit coverage');
  return sections;
}
