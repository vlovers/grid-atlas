/** Public prose helpers. Values remain source counts; wording never changes their meaning. */
export function ukrainianNoun(count: number, one: string, few: string, many: string) {
  const form = new Intl.PluralRules('uk').select(count);
  return form === 'one' ? one : form === 'few' ? few : many;
}
export function recordedPeriod(first: number | null, last: number | null, locale: 'en' | 'uk') {
  if (first === null || last === null) return '';
  if (first === last) return locale === 'uk' ? `у ${first} році` : `in ${first}`;
  return locale === 'uk' ? `у ${first}–${last} роках` : `from ${first} to ${last}`;
}
export function raceNameWithYear(race: { name: string; year: number }) {
  return new RegExp(`\\b${race.year}\\b`).test(race.name) ? race.name : `${race.name} · ${race.year}`;
}
