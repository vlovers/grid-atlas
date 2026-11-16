/** Deterministic text checks. Heuristics here only ever block; they never approve facts. */

/** Lowercase, NFKC, unify quotes/dashes/whitespace so excerpt matching ignores typography. */
export function normalizeText(text: string): string {
  return text.normalize('NFKC').toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'").replace(/[“”«»„]/g, '"')
    .replace(/[‐-―−]/g, '-').replace(/\s+/g, ' ').trim();
}

const WORD = /[\p{L}\p{N}]/u;
/**
 * True when `needle` occurs in `haystack` (both normalized) on whole-word boundaries, so a
 * truncated excerpt cannot change meaning: "shortened to 4" does not match "shortened to 4.2",
 * and "1961" does not match "19612".
 */
export function containsPhrase(haystack: string, needle: string): boolean {
  const h = normalizeText(haystack), n = normalizeText(needle);
  if (!n) return false;
  for (let at = h.indexOf(n); at !== -1; at = h.indexOf(n, at + 1)) {
    const before = h[at - 1] ?? '', after = h[at + n.length] ?? '', afterNext = h[at + n.length + 1] ?? '';
    if (WORD.test(n[0]) && WORD.test(before)) continue;
    if (WORD.test(n.at(-1)!) && WORD.test(after)) continue;
    if (/\d/.test(n.at(-1)!) && /[.,]/.test(after) && /\d/.test(afterNext)) continue;
    return true;
  }
  return false;
}

const SECOND_LEVEL = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'com.au', 'net.au', 'org.au', 'co.jp', 'co.nz', 'com.br', 'co.za', 'com.mx', 'com.ar', 'co.in', 'com.cn', 'com.ua', 'org.ua']);
/** Approximate registrable domain, so en.example.org and de.example.org count as one publisher. */
export function registrableDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, '').split('.');
  const lastTwo = labels.slice(-2).join('.');
  return labels.length > 2 && SECOND_LEVEL.has(lastTwo) ? labels.slice(-3).join('.') : lastTwo;
}

/** Digit groups (years, counts, lengths). "3.337" and "3,337" both normalize to "3.337". */
export function numberTokens(text: string): string[] {
  return (text.normalize('NFKC').match(/\d+(?:[.,]\d+)?/g) ?? []).map(token => token.replace(',', '.'));
}

/**
 * Numbers that must survive translation unchanged: years, decimals and values >= 21.
 * Smaller integers are often written as words ("Turn 10" → "Десятий поворот"), so they
 * are excluded from cross-language parity. Compared as a set: repetition is style.
 */
export function significantNumbers(text: string): string[] {
  return [...new Set(numberTokens(text).filter(token => token.includes('.') || Number(token) >= 21))].sort();
}

const PLACEHOLDER = /\b(?:todo|tbd|tbc|fixme|lorem ipsum|xxx+)\b|\[(?:citation needed|source|placeholder|insert[^\]]*)\]|\{\{[^}]*\}\}|<placeholder>|\.\.\.\s*$|…\s*$/i;

export function hasPlaceholder(text: string): boolean { return PLACEHOLDER.test(text); }

/** Stock phrases that mark generic machine prose. Matching any two in one block fails it. */
export const BOILERPLATE_EN = [
  'rich tapestry', 'testament to', 'stands as a', 'in conclusion', 'it is worth noting', 'delve into',
  'a true icon', 'iconic venue', 'steeped in history', 'requires precision and concentration',
  'challenging corner', 'thrilling spectacle', 'cemented its place', 'left an indelible mark',
  'needs no introduction', 'nestled in', 'beloved by fans', 'a must-see',
];
export const BOILERPLATE_UK = [
  'вимагає точності та концентрації', 'справжня ікона', 'залишив незгладимий слід', 'не потребує представлення',
  'багата історія', 'варто зазначити', 'на завершення',
];

export function boilerplateHits(text: string, locale: 'en' | 'uk'): string[] {
  const normalized = normalizeText(text);
  return (locale === 'en' ? BOILERPLATE_EN : BOILERPLATE_UK).filter(phrase => normalized.includes(phrase));
}

/** Share of letters that are Cyrillic. Proper names in Latin script are expected, so the bar is modest. */
export function cyrillicShare(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return 0;
  return letters.filter(letter => /\p{Script=Cyrillic}/u.test(letter)).length / letters.length;
}

export const paragraphs = (text: string) => text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

function shingles(text: string, size = 5): Set<string> {
  const words = normalizeText(text).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(' '));
  return out;
}

/** Jaccard similarity over 5-word shingles; 0 for texts too short to compare. */
export function similarity(a: string, b: string): number {
  const x = shingles(a), y = shingles(b);
  if (!x.size || !y.size) return 0;
  let shared = 0;
  for (const s of x) if (y.has(s)) shared++;
  return shared / (x.size + y.size - shared);
}

/**
 * Instruction-like text inside retrieved sources. Reported as a warning so operators can
 * see attempted injection; it never changes a verdict because source text is never obeyed.
 */
const INSTRUCTION_LIKE = /\b(ignore (?:all |any )?(?:previous|prior) instructions|you are (?:now )?an? (?:ai|assistant)|system prompt|mark (?:this|all|the) (?:claims? )?(?:as )?verified|set status to|approve (?:this|for) publication)\b/i;
export const looksLikeInstruction = (text: string) => INSTRUCTION_LIKE.test(text);
