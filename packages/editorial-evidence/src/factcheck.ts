/**
 * Independent historical fact-check stage.
 *
 * 1. Task generation (deterministic): for each claim candidate, find passages in the stored
 *    snapshots of the sources the text already cites that contain the claim's numbers and names.
 *    Passages are leads for the checker, not evidence of support.
 * 2. Verdict contract: a fact-checker (agent or human, never the writer) returns a verdict with
 *    verbatim excerpts. `verdictToClaim` turns it into a policy Claim; the editorial policy then
 *    re-checks every excerpt, number and identity. A verdict cannot verify anything on its own.
 */
import { claimDigest, containsPhrase, normalizeText, numberTokens } from '../../editorial-policy/src/index.ts';
import type { AgentRef, Claim, ClaimType, DatasetEvidence, SourceEvidence, SourceSnapshot } from '../../editorial-policy/src/index.ts';
import { sentences, type ClaimCandidate } from './claims.ts';
import type { DatasetCheck } from './dataset-check.ts';

/** `raw` is the full sentence as it occurs in the whitespace-normalised source text; `text` may be truncated for display. */
export type Passage = { source_id: string; url: string; text: string; raw: string; numbers_covered: boolean; names_matched: string[]; score: number };

/** Whitespace normalisation used for passage offsets (sentences() collapses whitespace the same way). */
export const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();
export type FactCheckTask = {
  claim_id: string; circuit_id: string; block_id: string; claim_type: ClaimCandidate['claim_type']; importance: ClaimCandidate['importance'];
  en: string; uk: string | null;
  status: 'dataset_conflict' | 'dataset_supported' | 'passages_cover_numbers' | 'passages_partial' | 'no_passage_in_live_sources' | 'cited_sources_unavailable' | 'no_cited_sources';
  dataset: DatasetCheck[]; passages: Passage[];
};

const STOP = new Set(['The', 'This', 'That', 'These', 'Those', 'In', 'On', 'At', 'After', 'Before', 'When', 'While', 'His', 'Her', 'Its', 'Their', 'A', 'An', 'It', 'He', 'She', 'They', 'There', 'Formula', 'Grand', 'Prix', 'World', 'Championship', 'Turn']);
const nameTokens = (text: string) => [...new Set((text.match(/\p{Lu}[\p{L}'’-]{2,}/gu) ?? []).filter(t => !STOP.has(t)))];
const contentWords = (text: string) => new Set(normalizeText(text).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3));
const MAX_PASSAGE = 320;

export function findPassages(en: string, docs: readonly { source_id: string; url: string; text: string }[]): Passage[] {
  const numbers = [...new Set(numberTokens(en))];
  const names = nameTokens(en);
  const words = contentWords(en);
  const scored: Passage[] = [];
  for (const doc of docs) for (const s of sentences(doc.text)) {
    if (s.length < 25) continue;
    const tokens = new Set(numberTokens(s));
    const covered = numbers.filter(n => tokens.has(n));
    const matched = names.filter(name => containsPhrase(s, name));
    const overlap = [...contentWords(s)].filter(w => words.has(w)).length;
    if (!covered.length && !matched.length) continue;
    scored.push({ source_id: doc.source_id, url: doc.url, text: s.length > MAX_PASSAGE ? `${s.slice(0, MAX_PASSAGE)}…` : s, raw: s,
      numbers_covered: covered.length === numbers.length, names_matched: matched, score: covered.length * 3 + matched.length * 2 + overlap });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 2);
}

export function buildTask(candidate: ClaimCandidate, dataset: DatasetCheck[],
  docs: readonly { source_id: string; url: string; text: string }[], citedCount: number): FactCheckTask {
  const passages = docs.length ? findPassages(candidate.en, docs) : [];
  let status: FactCheckTask['status'];
  if (dataset.some(d => d.status === 'conflict')) status = 'dataset_conflict';
  else if (dataset.length && dataset.every(d => d.status === 'supported') && candidate.claim_type === 'statistic') status = 'dataset_supported';
  else if (!citedCount) status = 'no_cited_sources';
  else if (!docs.length) status = 'cited_sources_unavailable';
  else if (!passages.length) status = 'no_passage_in_live_sources';
  else status = passages.some(p => p.numbers_covered && (p.names_matched.length || !nameTokens(candidate.en).length)) ? 'passages_cover_numbers' : 'passages_partial';
  return { claim_id: candidate.claim_id, circuit_id: candidate.circuit_id, block_id: candidate.block_id, claim_type: candidate.claim_type,
    importance: candidate.importance, en: candidate.en, uk: candidate.uk, status, dataset, passages };
}

export type FactCheckVerdict = {
  claim_id: string;
  verdict: 'supported' | 'contradicted' | 'insufficient' | 'disputed';
  evidence: SourceEvidence[];
  dataset_evidence: DatasetEvidence[];
  checker: AgentRef;
  checked_at: string;
  notes?: string;
};

const TYPE: Record<ClaimCandidate['claim_type'], ClaimType> = {
  statistic: 'structured_statistic', measurement: 'layout_fact', dated_event: 'historical_event',
  quotation: 'quotation', interpretation: 'interpretation', narrative: 'historical_event',
};

/** Legacy content has a recorded writer per source file, so checkers can be proven independent of it. */
export const legacyWriter = (file: string): AgentRef => ({ id: `legacy:${file}`, role: 'writer', run_id: `legacy:${file}` });

/**
 * Convert a verdict into a policy Claim. The policy — not this function — decides whether the
 * claim is verified: excerpts must occur in `sources`, numbers must be evidenced, the checker must
 * differ from the writer, and the verification is bound to the snapshots' hashes.
 */
export function verdictToClaim(candidate: ClaimCandidate, verdict: FactCheckVerdict, sources: readonly SourceSnapshot[],
  isDriverNameWord: (word: string) => boolean = () => false): Claim {
  if (verdict.claim_id !== candidate.claim_id) throw new Error(`verdict ${verdict.claim_id} does not belong to ${candidate.claim_id}`);
  const writer = legacyWriter(candidate.provenance.file);
  if (verdict.checker?.id === writer.id || verdict.checker?.run_id === writer.run_id) throw new Error('the legacy writer of this text cannot check it');
  // A sentence is a structured statistic only if nothing beyond driver names, years and race vocabulary
  // remains; otherwise ("with Ferrari", "from pole", "after a duel in the rain") it needs sources too.
  // EN/UK name agreement is enforced by the policy itself (claim_entities_differ_across_locales).
  const type = candidate.claim_type === 'statistic' && !isPureStatistic(candidate.en, isDriverNameWord) ? 'historical_event' : TYPE[candidate.claim_type];
  const claim: Claim = {
    claim_id: candidate.claim_id, entity: { type: 'circuit', id: candidate.circuit_id }, claim_type: type, importance: candidate.importance,
    statement: { en: candidate.en, uk: candidate.uk ?? '' },
    presentation: verdict.verdict === 'disputed' ? 'conflict_disclosed' : 'asserted',
    evidence: [...verdict.evidence, ...verdict.dataset_evidence],
    verification: { status: 'unverified', method: 'none', verifier: null, verified_at: null, claim_sha256: null },
  };
  const status = ({ supported: 'verified', contradicted: 'rejected', insufficient: 'insufficient_evidence', disputed: 'disputed' } as const)[verdict.verdict] as Claim['verification']['status'];
  claim.verification = {
    status, method: verdict.dataset_evidence.length && !verdict.evidence.length ? 'dataset_comparison' : 'independent_retrieval',
    verifier: verdict.checker, verified_at: verdict.checked_at, claim_sha256: claimDigest(claim, sources), notes: verdict.notes,
  };
  return claim;
}

/**
 * Words that a winner statistic may contain besides driver names and the year. Deliberately narrow:
 * pole, laps, margins, teams and places are facts of their own, so their presence makes the
 * sentence narrative (sources required), not a dataset-only statistic.
 */
const STAT_WORDS = new Set(['the', 'a', 'an', 'in', 'at', 'of', 'here', 'race', 'grand', 'prix', 'won', 'win', 'winner', 'victory',
  'took', 'claimed', 'was', 'his', 'her', 'it', 'this', 'that', 'year', 'season', 'edition', 'event', 's']);
const SENTENCE_WORDS = new Set(['the', 'in', 'at', 'grand', 'prix', 'formula', 'one', 'world', 'championship']);

/** True when, after removing recognised driver names, years and race vocabulary, no other content remains. */
export function isPureStatistic(en: string, isDriverNameWord: (word: string) => boolean = () => false): boolean {
  const words = en.normalize('NFC').replace(/\d+(?:[.,]\d+)?/g, ' ').split(/[^\p{L}'’]+/u).filter(Boolean);
  const rest = words.filter(w => {
    const base = w.replace(/['’]s$/u, '');
    if (/^\p{Lu}/u.test(base)) return !(isDriverNameWord(base) || SENTENCE_WORDS.has(base.toLowerCase()));
    return !STAT_WORDS.has(base.toLowerCase());
  });
  return rest.length === 0;
}
