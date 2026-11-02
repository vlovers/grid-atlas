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

/** AI/source checks are evidence, not independent approval of individual turn mappings. */
export function hasPublicationReadyCornerGuide(circuitId: string) {
  const guide = candidateCornerGuides.find(entry => entry.circuit_id === circuitId);
  if (!guide || guide.review_status !== 'independent_review_approved') return false;
  if (!Number.isInteger(guide.numbered_turns) || guide.numbered_turns < 1) return false;
  const numbers = guide.sections.flatMap(section => section.numbers);
  if (numbers.length !== guide.numbered_turns || new Set(numbers).size !== guide.numbered_turns) return false;
  if (numbers.some(number => !Number.isInteger(number) || number < 1 || number > guide.numbered_turns)) return false;
  if (guide.sections.some(section =>
    section.confirmation_status !== 'independently_verified' ||
    !section.explanation?.en?.trim() || !section.explanation?.uk?.trim() ||
    section.sources.length < 2 || section.sources.some(key => !Object.hasOwn(candidateCornerSources, key))
  )) return false;
  return true;
}

/** No runtime flag can publish research. Maintainers must review an exact bilingual edition. */
export function isCircuitEditionApproved(circuitId: string) {
  if (!hasPublicationReadyCornerGuide(circuitId)) return false;
  const editions = (publication.editions as Edition[]).filter(edition => edition.circuit_id === circuitId);
  if (editions.length !== 1) return false;
  const [edition] = editions;
  return edition.actor === 'human' && edition.decision === 'approved' &&
    Boolean(edition.reviewer?.trim() && edition.author?.trim()) && edition.reviewer !== edition.author &&
    /^\d{4}-\d{2}-\d{2}$/.test(edition.approved_at) &&
    /^[a-f0-9]{64}$/.test(edition.content_sha256) && edition.content_sha256 === circuitEditionDigest(circuitId);
}
