/**
 * Ukrainian case forms for foreign personal names, from a reviewed nominative table.
 *
 * Rules (Ukrainian orthography for masculine foreign names):
 *   - ending in -о, -е, -є, -і, -у, -ю: not declined (Алонсо, Піке, Фіттіпальді, Арну).
 *   - ending in -а: a-declension (Сенна → gen Сенни, dat/loc Сенні, acc Сенну, ins Сенною).
 *   - ending in -я: (Монтойя → gen/dat/loc Монтойї, acc Монтойю, ins Монтойєю).
 *   - ending in -ь: soft (Жиль → Жиля, Жилю/Жилеві, Жилем, Жилі).
 *   - other consonants: hard (Менселл → Менселла, Менселлу/Менселлові, acc = gen (animate),
 *     Менселлом, Менселлі/Менселлові); after ж/ч/ш/щ the instrumental is -ем.
 * Generated forms are reviewed together with the table; nothing here is a source of names.
 */

export type Case = 'nom' | 'gen' | 'dat' | 'acc' | 'ins' | 'loc';
export const CASES: Case[] = ['nom', 'gen', 'dat', 'acc', 'ins', 'loc'];
type Paradigm = Record<Case, string[]>;

const UNDECLINED = /[оеєіуюОЕЄІУЮ]$/u;

export function inflect(word: string): Paradigm {
  const all = (w: string): Paradigm => ({ nom: [w], gen: [w], dat: [w], acc: [w], ins: [w], loc: [w] });
  if (!word || UNDECLINED.test(word)) return all(word);
  if (/а$/u.test(word)) {
    const s = word.slice(0, -1);
    // Dative/locative alternation before -і: к→ц, г→з, х→с (Міка → Міці).
    const soft = s.replace(/к$/u, 'ц').replace(/г$/u, 'з').replace(/х$/u, 'с');
    return { nom: [word], gen: [`${s}и`], dat: [`${soft}і`], acc: [`${s}у`], ins: [`${s}ою`], loc: [`${soft}і`] };
  }
  if (/й$/u.test(word)) {
    const s = word.slice(0, -1);
    return { nom: [word], gen: [`${s}я`], dat: [`${s}ю`, `${s}єві`], acc: [`${s}я`], ins: [`${s}єм`], loc: [`${s}ї`, `${s}єві`] };
  }
  if (/я$/u.test(word)) {
    const s = word.slice(0, -1);
    return { nom: [word], gen: [`${s}ї`], dat: [`${s}ї`], acc: [`${s}ю`], ins: [`${s}єю`], loc: [`${s}ї`] };
  }
  if (/ь$/u.test(word)) {
    const s = word.slice(0, -1);
    return { nom: [word], gen: [`${s}я`], dat: [`${s}ю`, `${s}еві`], acc: [`${s}я`], ins: [`${s}ем`], loc: [`${s}і`, `${s}еві`] };
  }
  const ins = /[жчшщ]$/u.test(word) ? `${word}ем` : `${word}ом`;
  // After к/г/х the locative is -ові/-у, never -і (Кларкові, not Кларкі).
  const loc = /[кгх]$/u.test(word) ? [`${word}ові`, `${word}у`] : [`${word}і`, `${word}ові`];
  return { nom: [word], gen: [`${word}а`], dat: [`${word}у`, `${word}ові`], acc: [`${word}а`], ins: [ins], loc };
}

/** Table entry shape as written by scripts/build-uk-name-table.mjs. */
export type UkNameEntry = { key: string; full_forms: string[]; surname_forms: string[]; surname_key: string; review: { status: string } };

/**
 * Recogniser map (Ukrainian form → entity key) from the reviewed table. Only entries an
 * independent reviewer approved are loaded; pending or rejected entries are ignored, so their
 * names stay unrecognised and the policy's cross-language check fails closed for them.
 */
export function ukNameMap(entries: readonly UkNameEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  const surnameOwners = new Map<string, Set<string>>();
  for (const e of entries) {
    if (e.review?.status !== 'approved') continue;
    for (const f of e.full_forms) map.set(f, e.key);
    for (const f of e.surname_forms) {
      const owners = surnameOwners.get(f) ?? new Set<string>();
      owners.add(e.surname_key);
      surnameOwners.set(f, owners);
    }
  }
  // A bare form shared by different surnames (Масса: genitive of Масс, nominative of Масса) is ambiguous.
  for (const [form, owners] of surnameOwners) {
    if (map.has(form)) continue;
    map.set(form, owners.size === 1 ? [...owners][0] : `ambiguous:uk:${form.toLowerCase()}`);
  }
  return map;
}

/** Every case of "given surname" (all parts in the same case) and of the surname alone. */
export function nameForms(given: string, surname: string): { full: string[]; surname: string[] } {
  // Compound given names ("Хосе Фройлан") inflect each space-separated part; hyphenated parts
  // ("Жан-П'єр") inflect only the last element, as the existing drafts do ("Жан-П'єра").
  const givenParts = given.split(' ').filter(Boolean).map(inflect);
  const surnameParadigm = inflect(surname);
  const full = new Set<string>(), short = new Set<string>();
  for (const c of CASES) {
    for (const s of surnameParadigm[c]) {
      short.add(s);
      // Pair the first variant of each given-name part with every surname variant of the same case.
      full.add([...givenParts.map(p => p[c][0]), s].join(' '));
    }
  }
  return { full: [...full], surname: [...short] };
}
