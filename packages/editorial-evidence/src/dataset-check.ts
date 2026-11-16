/**
 * Deterministic comparison of claim candidates with the pinned F1DB release.
 *
 * Outcomes per check:
 *   supported    the dataset-checkable part matches (with a DatasetRef usable as evidence)
 *   conflict     the sentence appears to contradict the dataset — a candidate error for fact-check
 *   unmatched    the sentence has the shape of a dataset fact but the dataset cannot decide it
 * A supported check verifies only that component; the rest of the sentence still needs evidence.
 */
import type { DatasetRef } from '../../editorial-policy/src/index.ts';
import type { ClaimCandidate } from './claims.ts';
import type { ArchiveRace, F1dbIndex } from './f1db.ts';

export type CheckKind = 'race_winner' | 'pole' | 'fastest_lap' | 'race_year' | 'first_race' | 'layout_length' | 'turn_count' | 'race_count';
export type DatasetCheck = {
  kind: CheckKind; status: 'supported' | 'conflict' | 'unmatched';
  detail: string; refs: DatasetRef[];
};

const YEAR = /\b(19[5-9]\d|20[0-2]\d)\b/g;
const WIN = /\b(?:won|wins?|winning|winner|victory|victorious|triumph(?:ed)?)\b/i;
const NOT_A_RACE_WIN = /\b(?:title|championship crown|world champion(?:ship)?|drivers'? championship|constructors'? championship|race of champions|non-championship|le mans|sportscar|formula (?:2|two|3|three|5000)|indycar|cart|motorcycle)\b/i;
const NEGATION = /\b(?:not|never|no|failed to|denied|missed|lost)\b/i;
const RACE_WORDS = /\b(?:grand prix|race|won|victory|pole|fastest lap|podium|lap \d|grid)\b/i;

const yearsIn = (text: string) => [...new Set([...text.matchAll(YEAR)].map(m => Number(m[1])))];

export function checkCandidate(candidate: ClaimCandidate, index: F1dbIndex): DatasetCheck[] {
  const circuit = index.circuit(candidate.circuit_id);
  if (!circuit) return [];
  const text = candidate.en;
  const checks: DatasetCheck[] = [];
  const ref = (record: string, field: string): DatasetRef => ({ dataset: 'f1db', release: index.release, record, field });
  const mentioned = index.mentionedDrivers(text);
  const mentionedSlugs = new Set([...mentioned.values()].flat());
  const years = yearsIn(text);
  const seasons = new Set(circuit.races.map(r => r.season));

  // Years attached to race language must be seasons in which this circuit hosted a championship race.
  if (RACE_WORDS.test(text) && !NOT_A_RACE_WIN.test(text)) for (const year of years) {
    if (!seasons.has(year)) checks.push({ kind: 'race_year', status: 'unmatched', refs: [ref(`circuit:${circuit.circuit_id}`, 'first_season')],
      detail: `${year}: no ${circuit.circuit_id} championship race in F1DB (may be a non-championship event, opening date or another venue).` });
  }

  /**
   * Drivers asserted as the subject of an achievement: a surname within the same clause and at
   * most 60 characters before the verb ("Pace won", "Jarier took pole"). Mentions elsewhere
   * ("the winner cannot stand in for Senna's death") are context, not assertions.
   */
  /** Year occurrences with their character positions, for attaching an assertion to its nearest year. */
  const yearPositions = [...text.matchAll(YEAR)].map(m => ({ year: Number(m[1]), at: m.index ?? 0 }));
  const nearestYear = (at: number) => yearPositions.reduce<{ year: number; at: number } | null>((best, y) =>
    !best || Math.abs(y.at - at) < Math.abs(best.at - at) ? y : best, null)?.year ?? null;

  const raceCheck = (kind: 'race_winner' | 'pole' | 'fastest_lap', field: 'winner' | 'pole' | 'fastest_lap', pick: (r: ArchiveRace) => string[], verb: RegExp) => {
    if (NEGATION.test(text) || !mentionedSlugs.size || !yearPositions.length) return;
    const seen = new Set<number>();
    // Each asserting verb ("Pace won", "took pole") is checked against the year nearest to it, and
    // only the drivers named in its own clause shortly before it count as the asserted subject.
    for (const m of text.matchAll(new RegExp(verb.source, 'gi'))) {
      const at = m.index ?? 0;
      const year = nearestYear(at);
      if (year === null || seen.has(year)) continue;
      seen.add(year);
      const races = index.racesIn(circuit.circuit_id, year).filter(r => r.has_results);
      if (!races.length) continue;
      const clauseStart = Math.max(0, ...[...text.slice(0, at).matchAll(/[;:—–]|,\s(?:but|while|whereas|although|when)\s/g)].map(x => (x.index ?? 0) + x[0].length));
      // Active voice names the subject before the verb ("Pace won"); passive voice after it ("won by Pace").
      const passive = /^(?:won by|victory went to|went to)\b/i.test(m[0]);
      const window = passive ? text.slice(at + m[0].length, at + m[0].length + 40).split(/[;:,—–]/)[0] : text.slice(Math.max(clauseStart, at - 60), at);
      const subject = new Set([...index.mentionedDrivers(window).values()].flat());
      const truth = new Set(races.flatMap(pick));
      const hits = [...mentionedSlugs].filter(slug => truth.has(slug));
      const refs = races.map(r => ref(`race:${r.race_id}`, field));
      const expected = [...truth].map(slug => index.driverName(slug)).join(' / ') || 'none recorded';
      const wrong = [...subject].filter(slug => !truth.has(slug));
      const subjectHit = [...subject].some(slug => truth.has(slug));
      // A conflict needs one unambiguous race and an asserted subject of whom none matches.
      if (races.length === 1 && wrong.length && !subjectHit)
        checks.push({ kind, status: 'conflict', refs, detail: `${year}: sentence credits ${wrong.map(s => index.driverName(s)).join(', ')}; F1DB ${field} is ${expected}.` });
      else if (hits.length) checks.push({ kind, status: 'supported', refs, detail: `${year}: ${hits.map(s => index.driverName(s)).join(' / ')} matches F1DB ${field}.` });
      else checks.push({ kind, status: 'unmatched', refs, detail: races.length > 1 ? `${year}: ${races.length} races at this circuit; cannot attribute.` : `${year}: no named driver is credited; F1DB ${field} is ${expected}.` });
    }
  };
  if (WIN.test(text) && !NOT_A_RACE_WIN.test(text)) raceCheck('race_winner', 'winner', r => r.winners, /\b(?:won by|victory went to|won|wins|triumphed|took (?:the |his |her |a )?(?:\w+ )?(?:victory|win)|claimed (?:the |his |her |a )?(?:\w+ )?(?:victory|win))\b/);
  if (/\bpole(?: position)?\b/i.test(text)) raceCheck('pole', 'pole', r => r.pole, /\b(?:took|claimed|started from|secured|won|set) (?:the |his |her )?pole\b|\bon pole\b/);
  if (/\bfastest lap\b/i.test(text)) raceCheck('fastest_lap', 'fastest_lap', r => r.fastest_lap, /\b(?:set|recorded|took|claimed) (?:the )?fastest lap\b/);

  // "first championship race" about the venue: not a driver's personal first ("his first Grand Prix"),
  // and with its year in the same clause. "first race on the revised layout" is checked against layouts.
  const firstMatch = text.match(/\b(his|her|their)?\s?first (?:world championship |championship |formula (?:1|one) |f1 )(?:grand prix|race|round|event)\b([^;:—–]*)/i);
  if (firstMatch && !firstMatch[1]) {
    const at = firstMatch.index ?? 0;
    const clauseStart = Math.max(0, ...[...text.slice(0, at).matchAll(/[;:—–]/g)].map(x => (x.index ?? 0) + 1));
    const clauseEnd = at + firstMatch[0].length;
    const clauseYears = yearPositions.filter(y => y.at >= clauseStart && y.at <= clauseEnd).map(y => y.year);
    const layoutScoped = /\bon the (?:revised|new|current|modified|shortened|extended|reconfigured|original) (?:[\p{L}'’-]+ )?(?:layout|configuration|circuit|track)\b/iu.test(firstMatch[2] ?? '');
    if (clauseYears.length) {
      const candidates = layoutScoped ? circuit.layouts.map(l => l.seasons[0]).filter(Boolean) : [Math.min(...seasons)];
      const status = clauseYears.some(y => candidates.includes(y)) ? 'supported' : 'conflict';
      checks.push({ kind: 'first_race', status,
        refs: layoutScoped ? [] : [ref(`circuit:${circuit.circuit_id}`, 'first_season')],
        detail: status === 'supported' ? `First ${layoutScoped ? 'race on a layout' : 'championship race'} ${clauseYears.join(', ')} matches F1DB.`
          : `Clause years ${clauseYears.join(', ')}; F1DB ${layoutScoped ? `layout first seasons are ${candidates.join(', ')}` : `first championship race here is ${candidates[0]}`}.` });
    }
  }

  const lengths = circuit.layouts.map(l => ({ id: l.layout_id, km: Number(l.length_km) }));
  for (const m of text.matchAll(/(\d+[.,]\d+)\s?(?:km\b|kilomet)/gi)) {
    const value = Number(m[1].replace(',', '.'));
    const decimals = m[1].split(/[.,]/)[1].length;
    const hits = lengths.filter(l => Math.abs(Number(l.km.toFixed(decimals)) - value) < 1e-9);
    checks.push(hits.length
      ? { kind: 'layout_length', status: 'supported', refs: hits.map(h => ref(`layout:${h.id}`, 'length_km')), detail: `${value} km matches ${hits.map(h => h.id).join(', ')}.` }
      : { kind: 'layout_length', status: 'unmatched', refs: lengths.map(l => ref(`layout:${l.id}`, 'length_km')), detail: `${value} km matches no F1DB layout (${lengths.map(l => l.km).join(', ')} km); may be a non-F1 or pre-championship course.` });
  }

  const turnCounts = circuit.layouts.map(l => ({ id: l.layout_id, turns: l.turns }));
  for (const m of text.matchAll(/\b(\d{1,2})\s+(?:turns|corners|bends)\b/gi)) {
    const value = Number(m[1]);
    const hits = turnCounts.filter(l => l.turns === value);
    checks.push(hits.length
      ? { kind: 'turn_count', status: 'supported', refs: hits.map(h => ref(`layout:${h.id}`, 'turns')), detail: `${value} turns matches ${hits.map(h => h.id).join(', ')}.` }
      : { kind: 'turn_count', status: 'unmatched', refs: [], detail: `${value} turns matches no F1DB layout (${[...new Set(turnCounts.map(l => l.turns))].join(', ')}); may count a sequence or a sub-section.` });
  }

  const count = text.match(/\b(\d{1,2})\s+(?:world championship |championship |formula (?:1|one) )?(?:grands? prix|races)\b/i);
  if (count && /\b(?:hosted|staged|held)\b/i.test(text)) {
    const value = Number(count[1]);
    const total = circuit.races.length;
    checks.push({ kind: 'race_count', status: value === total ? 'supported' : 'unmatched', refs: [ref(`circuit:${circuit.circuit_id}`, 'race_count')],
      detail: value === total ? `${value} races matches.` : `${value} races vs ${total} in F1DB (may be a period subtotal).` });
  }
  return checks;
}
