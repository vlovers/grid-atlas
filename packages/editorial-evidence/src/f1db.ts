/**
 * Read-only index over the committed pinned-F1DB circuit export. It answers DatasetRef
 * lookups for the editorial policy and recognises drivers/constructors in prose.
 */
import type { DatasetRef, DatasetValue } from '../../editorial-policy/src/index.ts';

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

  constructor(archive: Archive) {
    this.archive = archive;
    this.release = archive.source.release;
    this.drivers = archive.drivers;
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

  /** Driver slugs whose surname appears capitalised as a whole word in the text. */
  mentionedDrivers(text: string): Map<string, string[]> {
    const found = new Map<string, string[]>();
    // Normalise first so decomposed accents do not split a name into two tokens.
    for (const token of text.normalize('NFC').match(/\p{Lu}[\p{L}]+/gu) ?? []) {
      const slugs = this.surnames.get(fold(token));
      if (slugs) found.set(token, slugs);
    }
    return found;
  }

  /**
   * EntityRecognizer for the editorial policy: driver slugs named in the text. Latin-script only —
   * Ukrainian (Cyrillic) names need the reviewed EN→UK name table before they can be bound.
   */
  entities = (text: string): string[] => [...new Set([...this.mentionedDrivers(text).values()].flat())];

  driverName(slug: string) { return this.drivers[slug] ?? slug; }

  /** Trusted surface forms for a driver: F1DB display name, slug name ("Carlos Pace") and surname. */
  driverMentions(slug: string): string[] {
    const fromSlug = slug.split('-').filter(p => !SUFFIXES.has(p)).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return [...new Set([this.driverName(slug), fromSlug, surnameFromSlug(slug)])];
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
    // Driver values are slugs; prose may name them only by the dataset's own surface forms.
    const join = (slugs: string[]): DatasetValue | null => (slugs.length
      ? { value: [...slugs].sort().join(' / '), mentions: slugs.flatMap(slug => this.driverMentions(slug)) } : null);
    if (kind === 'circuit') {
      const c = this.circuits.get(id);
      if (!c) return undefined;
      const seasons = c.races.map(race => race.season);
      switch (ref.field) {
        case 'first_season': return Math.min(...seasons);
        case 'last_season': return Math.max(...seasons);
        case 'race_count': return c.races.length;
        case 'country': return (c.fields.country as string) ?? null;
        case 'place': return (c.fields.place_name as string) ?? null;
        default: return undefined;
      }
    }
    if (kind === 'race') {
      const r = this.races.get(id)?.race;
      if (!r) return undefined;
      switch (ref.field) {
        case 'winner': return join(r.winners);
        case 'pole': return join(r.pole);
        case 'fastest_lap': return join(r.fastest_lap);
        case 'date': return r.date;
        case 'season': return r.season;
        case 'second': return join(r.podium.filter(p => p.position === 2).map(p => p.driver));
        case 'third': return join(r.podium.filter(p => p.position === 3).map(p => p.driver));
        default: return undefined;
      }
    }
    if (kind === 'layout') {
      const l = this.layouts.get(id)?.layout;
      if (!l) return undefined;
      if (ref.field === 'length_km') return Number(l.length_km);
      if (ref.field === 'turns') return l.turns;
      return undefined;
    }
    return undefined;
  };
}
