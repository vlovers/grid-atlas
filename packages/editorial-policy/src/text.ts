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

const EN_NUMBER: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const EN_COUNTED = 'laps?|races?|grands? prix|wins?|victories|victory|seconds?|points?|corners?|turns?|bends?|cars?|times|years?|titles?|podiums?|poles?|drivers?|kilometres?|kilometers?|miles?|metres?|meters?|positions?|places?|rounds?|hours?|minutes?|starts?|teams?|layouts?|configurations?|chicanes?|seasons?|championships?';
const EN_EXTRA: Record<string, number> = { dozen: 12, hundred: 100 };
const EN_TENS = 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety';
const EN_UNITS = 'one|two|three|four|five|six|seven|eight|nine';
// "twenty-one", "four", "a dozen", followed by at most two free words (never "of …") and a counted noun.
const EN_WORD_NUMBER = new RegExp(
  `\\b(?:(${EN_TENS})[-\\s](${EN_UNITS})|a\\s+(dozen|hundred)|(${[...Object.keys(EN_NUMBER), 'dozen', 'hundred'].join('|')}))` +
  `(?:\\s+(?!of\\b)[\\p{L}-]+){0,2}?\\s+(?:${EN_COUNTED})\\b`, 'giu');
const EN_ORDINAL: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20 };
// Finishing/grid positions are facts ("finished fourth"); ordinary ordinals ("the first race") are not counted.
const EN_POSITION = new RegExp(`\\b(?:finish(?:ed|ing)|placed|came(?:\\s+home)?|ended(?:\\s+up)?|qualif(?:ied|ying)|start(?:ed|ing)|classified|crossed\\s+the\\s+line)\\s+(?:in\\s+)?(${Object.keys(EN_ORDINAL).join('|')})\\b`, 'gi');
const EN_TIMES: Record<string, number> = { twice: 2, thrice: 3 };

const APOSTROPHES = "'’ʼ"; // apostrophe variants used in Ukrainian orthography
const A = `[${APOSTROPHES}]`;
const UK_NUMBER: [RegExp, number][] = ([
  ['одн(?:а|е|ого|ій|им|у)|один', 1], ['дв(?:а|і|ох|ом|ома)', 2], ['тр(?:и|ьох|ьом|ьома)', 3], ['чотир(?:и|ьох|ьом|ма)', 4],
  [`п${A}ят(?:ь|и|ьох)`, 5], ['ш(?:ість|ести|істьох)', 6], ['с(?:ім|еми|ьомох|імох)', 7], ['в(?:ісім|осьми|ісьмох)', 8],
  [`дев${A}ят(?:ь|и)`, 9], ['десят(?:ь|и)', 10], ['одинадцят(?:ь|и)', 11], ['дванадцят(?:ь|и)', 12], ['тринадцят(?:ь|и)', 13],
  ['чотирнадцят(?:ь|и)', 14], [`п${A}ятнадцят(?:ь|и)`, 15], ['шістнадцят(?:ь|и)', 16], ['сімнадцят(?:ь|и)', 17],
  ['вісімнадцят(?:ь|и)', 18], [`дев${A}ятнадцят(?:ь|и)`, 19], ['двадцят(?:ь|и)', 20], ['тридцят(?:ь|и)', 30], ['сорок(?:а)?', 40],
  [`п${A}ятдесят(?:и)?`, 50], ['шістдесят(?:и)?', 60], ['сімдесят(?:и)?', 70], ['вісімдесят(?:и)?', 80], [`дев${A}яност(?:о|а)`, 90], ['ст(?:о|а)', 100],
] as [string, number][]).map(([stem, value]) => [new RegExp(`(?<![\\p{L}${APOSTROPHES}])(?:${stem})(?:\\s+\\p{L}+)?\\s+(?:кол|кіл|гон|перег|перемог|секунд|очк|поворот|віраж|машин|автомобіл|бол[іо]д|раз|рок|літ|титул|пілот|кілометр|миль|метр|хвилин|годин|місц|етап|подіум|поул|старт|команд|сезон|конфігурац)\\p{L}*`, 'giu'), value]);
const UK_ORDINAL: [string, number][] = [['перш', 1], ['друг', 2], ['трет', 3], ['четверт', 4], [`п${A}ят`, 5], ['шост', 6], ['сьом', 7], ['восьм', 8], [`дев${A}ят`, 9], ['десят', 10]];
const UK_POSITION = new RegExp(`(?:фінішува\\p{L}*|ста(?:в|ла|ли)|кваліфікува\\p{L}*|стартува\\p{L}*|приїха\\p{L}*)\\s+(?:лише\\s+|тільки\\s+)?(${UK_ORDINAL.map(([s]) => s).join('|')})(?:им|ою|ій|ою|ими)(?![\\p{L}])`, 'giu');

/**
 * Number words that state a count or a position ("won by four full laps", "a dozen races",
 * "finished fourth", "twice", "п'ять кіл", "фінішував четвертим") as numerals, so they face the
 * same evidence and EN/UK checks as digits. Idioms ("one of the greatest", "the first race",
 * "одна з") are not counts and are left alone. Roman numerals are not interpreted (documented limit).
 */
export function spelledNumbers(text: string): string[] {
  const t = text.normalize('NFC');
  const out: string[] = [];
  for (const m of t.matchAll(EN_WORD_NUMBER)) {
    const value = m[1] ? EN_NUMBER[m[1].toLowerCase()] + EN_NUMBER[m[2].toLowerCase()]
      : m[3] ? EN_EXTRA[m[3].toLowerCase()] : EN_NUMBER[m[4].toLowerCase()] ?? EN_EXTRA[m[4].toLowerCase()];
    out.push(String(value));
  }
  for (const m of t.matchAll(EN_POSITION)) out.push(String(EN_ORDINAL[m[1].toLowerCase()]));
  for (const m of t.matchAll(/\b(twice|thrice)\b/gi)) out.push(String(EN_TIMES[m[1].toLowerCase()]));
  for (const [pattern, value] of UK_NUMBER) for (let i = [...t.matchAll(pattern)].length; i > 0; i--) out.push(String(value));
  for (const m of t.matchAll(UK_POSITION)) {
    const stem = m[1].toLowerCase();
    const hit = UK_ORDINAL.find(([s]) => new RegExp(`^${s}$`, 'u').test(stem));
    if (hit) out.push(String(hit[1]));
  }
  return out;
}

/** Digits outside 0–9 (Arabic-Indic, Devanagari, fullwidth after NFKC…) cannot be checked, so they are rejected. */
export const hasNonAsciiDigits = (text: string) => /(?![0-9])\p{Nd}/u.test(text.normalize('NFKC'));

/** Digit groups (years, counts, lengths) plus counted number words. "3.337" and "3,337" both normalize to "3.337". */
export function numberTokens(text: string): string[] {
  const digits = (text.normalize('NFKC').match(/[0-9]+(?:[.,][0-9]+)?/g) ?? []).map(token => token.replace(',', '.'));
  return [...digits, ...spelledNumbers(text)];
}

/**
 * Numbers that must survive translation unchanged: years, decimals and values >= 21.
 * Smaller integers are often written as words ("Turn 10" → "Десятий поворот"), so they
 * are excluded from cross-language parity. Compared as a set: repetition is style.
 */
export function significantNumbers(text: string): string[] {
  return [...new Set(numberTokens(text).filter(token => token.includes('.') || Number(token) >= 21))].sort();
}

// "xxxx" (four or more) so the Roman numeral XXX is not a placeholder.
const PLACEHOLDER = /\b(?:todo|tbd|tbc|fixme|lorem ipsum|x{4,})\b|\[(?:citation needed|source|placeholder|insert[^\]]*|джерело|потрібне джерело|уточнити[^\]]*)\]|\{\{[^}]*\}\}|<placeholder>|\.\.\.\s*$|…\s*$/iu;
// Ukrainian editor markers are matched only in capitals: "зробити" is an ordinary verb.
const PLACEHOLDER_UK_MARKER = /(?<![\p{L}])(?:ЗРОБИТИ|ДОПИСАТИ|УТОЧНИТИ|ПЕРЕВІРИТИ)(?![\p{L}])/u;

export function hasPlaceholder(text: string): boolean { return PLACEHOLDER.test(text) || PLACEHOLDER_UK_MARKER.test(text); }

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
