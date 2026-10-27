import { createHash } from 'node:crypto';
import publication from './circuit-release.json' with { type: 'json' };
import { candidateCircuitNarratives, candidateCornerGuides, candidateCornerSources } from './circuit-candidates.ts';

type Edition = { circuit_id: string; content_sha256: string; author: string; reviewer: string;
  actor: 'human'; decision: 'approved'; approved_at: string };

export function circuitEditionDigest(circuitId: string) {
  return createHash('sha256').update(JSON.stringify({
    narrative: candidateCircuitNarratives.find(entry => entry.circuit_id === circuitId) ?? null,
    corners: candidateCornerGuides.find(guide => guide.circuit_id === circuitId) ?? null,
    sources: candidateCornerSources,
  })).digest('hex');
}

/** No runtime flag can publish research. Maintainers must review an exact bilingual edition. */
export function isCircuitEditionApproved(circuitId: string) {
  const editions = (publication.editions as Edition[]).filter(edition => edition.circuit_id === circuitId);
  if (editions.length !== 1) return false;
  const [edition] = editions;
  return edition.actor === 'human' && edition.decision === 'approved' &&
    Boolean(edition.reviewer?.trim() && edition.author?.trim()) && edition.reviewer !== edition.author &&
    /^\d{4}-\d{2}-\d{2}$/.test(edition.approved_at) &&
    /^[a-f0-9]{64}$/.test(edition.content_sha256) && edition.content_sha256 === circuitEditionDigest(circuitId);
}
