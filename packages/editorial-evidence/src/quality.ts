/**
 * Deterministic writing-quality and EN/UK consistency signals. Signals route work (expand,
 * rewrite, fact-check); they never approve text. Thresholds are documented with each flag.
 */
import { boilerplateHits, cyrillicShare, normalizeText, numberTokens, significantNumbers } from '../../editorial-policy/src/index.ts';
import { sentences, type ContentSource } from './claims.ts';

export type QualityReport = {
  block_id: string; circuit_id: string; kind: string;
  en_words: number; uk_words: number; sentences: number; specificity: number; lexical_diversity: number;
  flags: string[]; en_uk: string[];
};

const words = (text: string) => text.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
/** Minimum English words before a block of this kind reads as more than a caption. */
const MIN_WORDS: Record<string, number> = { short_summary: 25, long_history_draft: 120, narrative_biography: 30, defining_moment: 25, legacy_history: 20, legacy_moment: 15, corner_section: 25, corner_group: 30 };

/** Sentence openings ("Turn 7 is a …") reused across many blocks signal templated prose. */
export function openingKey(sentence: string): string {
  return normalizeText(sentence).replace(/\d+/g, '#').split(/\s+/).slice(0, 4).join(' ');
}

export function assessCorpus(blocks: readonly ContentSource[]): QualityReport[] {
  // Corpus-wide repetition: identical sentences in different circuits, and templated openings.
  const sentenceCircuits = new Map<string, Set<string>>();
  const openingUse = new Map<string, number>();
  for (const block of blocks) for (const s of sentences(block.en)) {
    const key = normalizeText(s);
    if (words(s).length >= 6) sentenceCircuits.set(key, (sentenceCircuits.get(key) ?? new Set()).add(block.circuit_id));
    const opening = openingKey(s);
    openingUse.set(opening, (openingUse.get(opening) ?? 0) + 1);
  }
  return blocks.map(block => {
    const en = block.en ?? '', uk = block.uk ?? '';
    const enWords = words(en), ukWords = words(uk);
    const list = sentences(en);
    const capitals = (en.match(/(?<!^|[.!?]\s)\b\p{Lu}[\p{L}'’-]+/gu) ?? []).length;
    const specificity = enWords.length ? Number(((numberTokens(en).length + capitals) / enWords.length).toFixed(3)) : 0;
    const sample = enWords.slice(0, 150).map(w => w.toLowerCase());
    const diversity = sample.length ? Number((new Set(sample).size / sample.length).toFixed(3)) : 0;
    const flags: string[] = [];
    if (!enWords.length) flags.push('en_missing');
    else {
      if (enWords.length < (MIN_WORDS[block.kind] ?? 25)) flags.push('shallow:short');
      if (specificity < 0.06 && enWords.length >= 15) flags.push('shallow:few_specifics');        // <6% names/numbers
      if (diversity < 0.45 && sample.length >= 60) flags.push('repetitive:low_lexical_diversity');
      const hits = boilerplateHits(en, 'en');
      if (hits.length) flags.push(`generic:${hits.join('/')}`);
      const shared = list.filter(s => (sentenceCircuits.get(normalizeText(s))?.size ?? 0) > 1).length;
      if (shared) flags.push(`repetitive:sentence_shared_across_circuits:${shared}`);
      const templated = list.filter(s => (openingUse.get(openingKey(s)) ?? 0) >= 25).length;
      if (templated && block.kind !== 'corner_section') flags.push(`repetitive:templated_opening:${templated}`);
      if (templated / Math.max(1, list.length) > 0.5 && block.kind === 'corner_section') flags.push('repetitive:templated_corner_text');
    }
    return {
      block_id: block.block_id, circuit_id: block.circuit_id, kind: block.kind,
      en_words: enWords.length, uk_words: ukWords.length, sentences: list.length, specificity, lexical_diversity: diversity,
      flags, en_uk: enUkConsistency(en, uk),
    };
  });
}

/**
 * EN/UK structural consistency. Meaning is not compared (that needs a bilingual reviewer);
 * these checks catch omissions, drift in facts that should survive translation, and untranslated text.
 */
export function enUkConsistency(en: string, uk: string): string[] {
  const issues: string[] = [];
  if (!en.trim() || !uk.trim()) return en.trim() || uk.trim() ? [!uk.trim() ? 'uk_missing' : 'en_missing'] : [];
  if (cyrillicShare(uk) < 0.5) issues.push('uk_untranslated');
  const a = significantNumbers(en), b = significantNumbers(uk);
  const onlyEn = a.filter(n => !b.includes(n)), onlyUk = b.filter(n => !a.includes(n));
  if (onlyEn.length) issues.push(`number_only_in_en:${onlyEn.join('/')}`);
  if (onlyUk.length) issues.push(`number_only_in_uk:${onlyUk.join('/')}`);
  const ratio = words(uk).length / Math.max(1, words(en).length);
  if (ratio < 0.6) issues.push(`uk_much_shorter:${ratio.toFixed(2)}`);   // Ukrainian typically runs 0.8–1.1× English word count
  if (ratio > 1.5) issues.push(`uk_much_longer:${ratio.toFixed(2)}`);
  const se = sentences(en).length, su = sentences(uk).length;
  if (Math.abs(se - su) >= 2) issues.push(`sentence_count:${se}/${su}`);
  // Latin-script names kept in the Ukrainian text must exist in the English (catches added facts).
  const enLatin = new Set((en.match(/\p{Script=Latin}{3,}/gu) ?? []).map(w => w.toLowerCase()));
  const ukOnly = [...new Set((uk.match(/\p{Lu}\p{Script=Latin}{2,}/gu) ?? []).filter(w => !enLatin.has(w.toLowerCase())))];
  if (ukOnly.length) issues.push(`latin_only_in_uk:${ukOnly.slice(0, 5).join('/')}`);
  return issues;
}
