/**
 * Claim candidates from existing editorial text. No rewriting: every candidate is an exact
 * sentence of an existing block, with the file, JSON path, sentence index and hashes needed
 * to trace it back. Candidates are inputs to verification, never verified facts.
 */
import { sha256, numberTokens } from '../../editorial-policy/src/index.ts';

export type ContentSource = {
  block_id: string; circuit_id: string; kind: string; file: string; json_path: string;
  en: string; uk: string; cited_urls: string[]; year_label: string | null;
};

export type ClaimCandidate = {
  claim_id: string; block_id: string; circuit_id: string; kind: string;
  provenance: { file: string; json_path: string; sentence_index: number; block_en_sha256: string; sentence_en_sha256: string };
  en: string; uk: string | null; alignment: 'sentence' | 'unaligned';
  claim_type: 'statistic' | 'dated_event' | 'measurement' | 'quotation' | 'interpretation' | 'narrative';
  importance: 'critical' | 'standard';
  cited_urls: string[];
};

const ABBREVIATIONS = /\b(?:St|Dr|Mr|Mrs|Ms|Jr|Sr|vs|No|Mt|Ste|ім|св|р|ст|т\.\s?зв)\.$/iu;

/** Sentence split for EN and UK prose; keeps abbreviations ("St.", "Jr.") and decimals intact. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  let current = '';
  const parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+(?=["“«(]?[\p{Lu}\p{N}])/u);
  for (const part of parts) {
    current = current ? `${current} ${part}` : part;
    if (!ABBREVIATIONS.test(current)) { out.push(current.trim()); current = ''; }
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

const WIN = /\b(?:won|wins?|winning|winner|victory|victories|victorious|triumph(?:ed)?)\b/i;
const QUOTE = /["“][^"”]{8,}["”]/;
const MEASURE = /\d+(?:[.,]\d+)?\s?(?:km|kilomet|miles?|metres?|meters?|m\b|mph|km\/h|kph)/i;
const EVALUATIVE = /\b(?:greatest|finest|best|worst|most (?:famous|beautiful|dangerous|demanding|iconic)|legendary|iconic|unforgettable|remarkable|celebrated|beloved)\b/i;

export function classify(en: string): Pick<ClaimCandidate, 'claim_type' | 'importance'> {
  const hasNumber = numberTokens(en).length > 0;
  if (QUOTE.test(en)) return { claim_type: 'quotation', importance: 'critical' };
  if (MEASURE.test(en)) return { claim_type: 'measurement', importance: 'critical' };
  if (WIN.test(en) || /\bpole\b|fastest lap/i.test(en)) return { claim_type: 'statistic', importance: 'critical' };
  if (hasNumber) return { claim_type: 'dated_event', importance: 'critical' };
  if (EVALUATIVE.test(en)) return { claim_type: 'interpretation', importance: 'standard' };
  return { claim_type: 'narrative', importance: 'standard' };
}

/** One candidate per English sentence; Ukrainian aligned by index only when sentence counts match. */
export function extractClaims(source: ContentSource): ClaimCandidate[] {
  const en = sentences(source.en);
  const uk = sentences(source.uk);
  const aligned = en.length === uk.length;
  const blockHash = sha256(source.en);
  return en.map((sentence, index) => ({
    claim_id: `${source.block_id}#s${index + 1}`,
    block_id: source.block_id, circuit_id: source.circuit_id, kind: source.kind,
    provenance: { file: source.file, json_path: source.json_path, sentence_index: index, block_en_sha256: blockHash, sentence_en_sha256: sha256(sentence) },
    en: sentence, uk: aligned ? uk[index] : null, alignment: aligned ? 'sentence' : 'unaligned',
    ...classify(sentence), cited_urls: source.cited_urls,
  }));
}
