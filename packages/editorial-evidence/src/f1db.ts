/**
 * Read-only index over the committed pinned-F1DB circuit export. It answers DatasetRef
 * lookups for the editorial policy and recognises drivers/constructors in prose.
 */
import type { DatasetEvidence, DatasetRef, DatasetValue } from '../../editorial-policy/src/index.ts';

export type ArchiveRace = {
  race_id: string; season: number; round: number; date: string; name: string; has_results: boolean;
  winners: string[]; winning_constructors: string[]; pole: string[]; fastest_lap: string[];
  podium: { position: number; driver: string }[];
};
export type ArchiveLayout = { layout_id: string; length_km: number; turns: number; seasons: number[]; directions: string[]; race_turn_counts: number[]; race_ids: string[] };
export type ArchiveCircuit = { circuit_id: string; name: string; fields: Record<string, string | number | undefined>; layouts: ArchiveLayout[]; races: ArchiveRace[] };
export type Archive = {
  source: { dataset: 'f1db'; release: string; artifact: string; sha256: string };
  circuits: ArchiveCircuit[]; drivers: Record<string, string>; constructors: Record<string, string>;
};

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii']);
/** Accent- and case-insensitive key: "Räikkönen" and slug "raikkonen" meet at "raikkonen". */
export const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Surname as it appears in prose, from the F1DB slug: "elio-de-angelis" → "Angelis", "nelson-piquet-jr" → "Piquet". */
export function surnameFromSlug(slug: string): string {
  const parts = slug.split('-').filter(part => !SUFFIXES.has(part));
  const last = parts.at(-1) ?? slug;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export class F1dbIndex {
  readonly release: string;
  private readonly circuits = new Map<string, ArchiveCircuit>();
  private readonly races = new Map<string, { race: ArchiveRace; circuit: ArchiveCircuit }>();
  private readonly layouts = new Map<string, { layout: ArchiveLayout; circuit: ArchiveCircuit }>();
  /** Folded surname → driver slugs sharing it (Hill, Schumacher, Villeneuve… are ambiguous). */
  readonly surnames = new Map<string, string[]>();
  readonly drivers: Record<string, string>;

  readonly archive: Archive;
  /** Every token of every driver slug ("carlos", "pace"): words that may be part of a driver's name. */
  private readonly nameTokens = new Set<string>();
  /** Reviewed Ukrainian surface form → entity key (driver slug, "ambiguous:<surname>" or "constructor:<slug>"). Empty until the reviewed table exists. */
  private readonly ukNames: ReadonlyMap<string, string>;
  /** Constructor display and slug names → "constructor:<slug>". */
  private readonly constructorNames: [string, string][] = [];

  constructor(archive: Archive, ukNames: ReadonlyMap<string, string> = new Map()) {
    this.archive = archive;
    this.release = archive.source.release;
    this.drivers = archive.drivers;
    this.ukNames = ukNames;
    for (const slug of Object.keys(archive.drivers)) for (const part of slug.split('-')) if (part.length > 1) this.nameTokens.add(part);
    for (const [slug, display] of Object.entries(archive.constructors ?? {})) {
      for (const name of new Set([display, this.slugName(slug)])) if (name.length >= 3) this.constructorNames.push([name, `constructor:${slug}`]);
    }
    for (const circuit of archive.circuits) {
      this.circuits.set(circuit.circuit_id, circuit);
      for (const race of circuit.races) this.races.set(race.race_id, { race, circuit });
      for (const layout of circuit.layouts) this.layouts.set(layout.layout_id, { layout, circuit });
    }
    for (const slug of Object.keys(archive.drivers)) {
      const key = fold(surnameFromSlug(slug));
      if (key.length < 3) continue;
      this.surnames.set(key, [...(this.surnames.get(key) ?? []), slug]);
    }
  }

  circuit(id: string) { return this.circuits.get(id); }
  racesIn(circuitId: string, season: number) { return this.circuits.get(circuitId)?.races.filter(race => race.season === season) ?? []; }
  layout(id: string) { return this.layouts.get(id)?.layout; }

  /**
   * Driver slugs whose surname appears capitalised as a whole word in the text. When a first name
   * precedes the surname ("Ralf Schumacher", "Damon Hill"), only drivers with that first name are kept.
   */
  mentionedDrivers(text: string): Map<string, string[]> {
    const found = new Map<string, string[]>();
    // Normalise first so decomposed accents do not split a name into two tokens.
    // Possessives ("Senna's", "Senna’s") fold to the name itself.
    const tokens = [...text.normalize('NFC').matchAll(/\p{Lu}[\p{L}'’-]*\p{L}|\p{Lu}\p{L}/gu)].map(m => m[0].replace(/['’]s$/u, ''));
    tokens.forEach((token, i) => {
      const slugs = this.surnames.get(fold(token));
      if (!slugs) return;
      const first = i > 0 ? fold(tokens[i - 1]) : '';
      const narrowed = slugs.filter(slug => fold(slug.split('-')[0]) === first);
      const key = narrowed.length ? `${tokens[i - 1]} ${token}` : token;
      found.set(key, narrowed.length ? narrowed : slugs);
    });
    return found;
  }

  /**
   * EntityRecognizer for the editorial policy. English: driver slugs found by surname (Latin script).
   * Ukrainian: only forms in the reviewed name table are recognised (case-insensitive), plus any
   * Latin-script names kept in the Ukrainian text. With no table, Cyrillic names are not recognised,
   * so the policy's cross-language entity check fails closed for every claim that names someone.
   */
  entities = (text: string, locale: 'en' | 'uk' = 'en'): string[] => {
    const keys: string[] = [];
    // A bare surname shared by several drivers ("Hill", "Schumacher") is its own entity,
    // "ambiguous:<surname>", so evidence naming one Hill can never back a claim about another.
    let rest = text.normalize('NFC');
    for (const [mention, slugs] of this.mentionedDrivers(text)) {
      keys.push(...(slugs.length > 1 && !mention.includes(' ') ? [`ambiguous:${fold(mention)}`] : slugs));
      // A full driver name ("Alain Prost", "Jack Brabham") is not also a mention of the team named after him.
      if (mention.includes(' ')) rest = rest.replaceAll(mention, ' ');
    }
    // Constructors by name ("Ferrari", "Red Bull"), case-sensitive so "red" or "brabham" in prose are not teams.
    // A bare "Prost" or "Hill" matches both the driver and the team: deliberately ambiguous, so it fails closed.
    for (const [name, key] of this.constructorNames) if (new RegExp(`(?<![\\p{L}])${escapeRe(name)}(?![\\p{L}])`, 'u').test(rest)) keys.push(key);
    if (locale === 'uk') {
      const lower = text.normalize('NFC').toLowerCase();
      for (const [form, key] of this.ukNames) if (new RegExp(`(?<![\\p{L}])${escapeRe(form.toLowerCase())}(?![\\p{L}])`, 'u').test(lower)) keys.push(key);
    }
    return [...new Set(keys)];
  };

  /**
   * Trusted canonical renderer for the editorial policy (StructuredRenderer). Only the winner and
   * season of one race with a single winner have a canonical wording; Ukrainian needs the driver's
   * reviewed Ukrainian name. Everything else returns null, so it needs sources.
   */
  renderStructured = (evidence: readonly DatasetEvidence[], locale: 'en' | 'uk'): string | null => {
    const byField = new Map(evidence.map(e => [e.dataset_ref.field, e]));
    const winner = byField.get('winner'), season = byField.get('season');
    if (evidence.length !== 2 || !winner || !season || winner.dataset_ref.record !== season.dataset_ref.record) return null;
    const race = this.races.get(winner.dataset_ref.record.replace(/^race:/, ''))?.race;
    if (!race || race.winners.length !== 1 || winner.dataset_ref.release !== this.release) return null;
    const slug = race.winners[0];
    if (locale === 'en') return `${this.slugName(slug)} won the ${race.season} race.`;
    const uk = [...this.ukNames].find(([, key]) => key === slug)?.[0];
    return uk ? `Перегони ${race.season} року виграв ${uk}.` : null;
  };

  private slugName(slug: string) {
    return slug.split('-').filter(p => !SUFFIXES.has(p)).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  /** True when the word could be (part of) a driver's name in F1DB. */
  isDriverNameWord = (word: string): boolean => this.nameTokens.has(fold(word.replace(/['’]s$/u, '')));

  driverName(slug: string) { return this.drivers[slug] ?? slug; }

  /**
   * Trusted surface forms for a driver: F1DB display name and slug name ("Carlos Pace"). A bare
   * surname is not a mention of a specific driver: "Hill" is not evidence for Graham Hill.
   */
  driverMentions(slug: string): string[] {
    return [...new Set([this.driverName(slug), this.slugName(slug)])];
  }

  /**
   * DatasetLookup for the editorial policy. Records:
   *   circuit:<id>  first_season | last_season | race_count | country | place
   *   race:<id>     winner | pole | fastest_lap | date | season | second | third   (driver slugs, sorted, " / "-joined)
   *   layout:<id>   length_km | turns
   */
  lookup = (ref: DatasetRef): DatasetValue | null | undefined => {
    if (ref.dataset !== 'f1db' || ref.release !== this.release) return undefined;
    const [kind, ...rest] = ref.record.split(':');
    const id = rest.join(':');
    // Every value carries the scope of its record, so the policy can refuse a record about
    // another circuit, race or season. Driver values are slugs, named in prose only by the
    // dataset's own surface forms.
    const scoped = (value: string | number | null | undefined, scope: string[], mentions: string[] = []): DatasetValue | null | undefined =>
      value === undefined ? undefined : value === null ? null : { value, mentions, scope };
    const drivers = (slugs: string[], scope: string[]) =>
      slugs.length ? scoped([...slugs].sort().join(' / '), scope, slugs.flatMap(slug => this.driverMentions(slug))) : null;
    if (kind === 'circuit') {
      const c = this.circuits.get(id);
      if (!c) return undefined;
      const seasons = c.races.map(race => race.season);
      const scope = [`circuit:${id}`];
      switch (ref.field) {
        case 'first_season': return scoped(Math.min(...seasons), scope);
        case 'last_season': return scoped(Math.max(...seasons), scope);
        case 'race_count': return scoped(c.races.length, scope);
        case 'country': return scoped((c.fields.country as string) ?? null, scope);
        case 'place': return scoped((c.fields.place_name as string) ?? null, scope);
        default: return undefined;
      }
    }
    if (kind === 'race') {
      const entry = this.races.get(id);
      if (!entry) return undefined;
      const r = entry.race;
      const scope = [`race:${id}`, `circuit:${entry.circuit.circuit_id}`, `season:${r.season}`];
      switch (ref.field) {
        case 'winner': return drivers(r.winners, scope);
        case 'pole': return drivers(r.pole, scope);
        case 'fastest_lap': return drivers(r.fastest_lap, scope);
        case 'date': return scoped(r.date, scope);
        case 'season': return scoped(r.season, scope);
        case 'second': return drivers(r.podium.filter(p => p.position === 2).map(p => p.driver), scope);
        case 'third': return drivers(r.podium.filter(p => p.position === 3).map(p => p.driver), scope);
        default: return undefined;
      }
    }
    if (kind === 'layout') {
      const entry = this.layouts.get(id);
      if (!entry) return undefined;
      const scope = [`layout:${id}`, `circuit:${entry.circuit.circuit_id}`];
      if (ref.field === 'length_km') return scoped(Number(entry.layout.length_km), scope);
      if (ref.field === 'turns') return scoped(entry.layout.turns, scope);
      return undefined;
    }
    return undefined;
  };
}
