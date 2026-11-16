/**
 * Corner-name research without invention.
 *
 * A name may be attached to a numbered turn of a specific layout only when a stored source
 * excerpt contains the name AND identifies the turn (its number, or an explicit numbered-map
 * label), and the source speaks to a period in which that layout was raced. Anything less stays
 * "number_only" or "research_incomplete". Modern names are never projected backwards.
 */
import { containsPhrase, sha256 } from '../../editorial-policy/src/index.ts';
import type { CornerModel } from './ingest.ts';
import type { ArchiveCircuit } from './f1db.ts';

export type CornerNameCandidate = {
  layout_id: string; turn: number; name: string;
  source_id: string; excerpt: string; locator: string;
  /** Year the source describes (map edition, article date or stated period). */
  source_period_year: number;
};

export type CornerNameDecision = { accepted: boolean; status: 'named_source_backed' | 'rejected'; reasons: string[] };

/** Turn reference forms: "Turn 7", "T7", "turn seven" is not accepted (ambiguous in maps). */
const turnPattern = (turn: number) => new RegExp(`(?<![\\p{L}\\p{N}])(?:turns?|t|corner|curva|virage|kurve|curve|поворот(?:и|у)?)\\s?${turn}(?![\\p{N}])`, 'iu');

export function acceptCornerName(c: CornerNameCandidate, snapshot: { source_id: string; text: string; content_sha256: string } | undefined,
  layoutSeasons: readonly number[]): CornerNameDecision {
  const reasons: string[] = [];
  if (!c.name?.trim() || /^(turn|t)\s?\d+$/i.test(c.name.trim())) reasons.push('not_a_name');
  if (!snapshot || snapshot.source_id !== c.source_id) reasons.push('source_snapshot_missing');
  else if (sha256(snapshot.text) !== snapshot.content_sha256) reasons.push('source_snapshot_integrity');
  else if (!containsPhrase(snapshot.text, c.excerpt)) reasons.push('excerpt_not_in_source');
  if (!containsPhrase(c.excerpt ?? '', c.name ?? '')) reasons.push('name_not_in_excerpt');
  if (!turnPattern(c.turn).test(c.excerpt ?? '')) reasons.push('turn_number_not_in_excerpt');
  if (!c.locator?.trim()) reasons.push('locator_missing');
  if (!layoutSeasons.length) reasons.push('layout_unknown');
  else {
    const first = Math.min(...layoutSeasons), last = Math.max(...layoutSeasons);
    if (!(c.source_period_year >= first && c.source_period_year <= last)) reasons.push('source_period_outside_layout_seasons');
  }
  return reasons.length ? { accepted: false, status: 'rejected', reasons } : { accepted: true, status: 'named_source_backed', reasons: [] };
}

export type ExistingNameCheck = {
  circuit_id: string; layout_id: string; section_id: string; numbers: number[]; name: string;
  numbering_year: number; layout_seasons: string; cited_sources: number; live_sources: number;
  /** name_not_in_cited_text means "this source text does not show it" — not that the name is wrong. */
  status: 'name_found_in_cited_source' | 'name_not_in_cited_text' | 'cited_sources_unavailable' | 'no_cited_sources';
  period: 'within_layout_seasons' | 'outside_layout_seasons' | 'layout_unknown';
};

/** Re-check every existing named corner against the text of the sources it already cites. */
export function checkExistingNames(model: CornerModel, circuits: readonly ArchiveCircuit[],
  snapshotText: (url: string) => string | null): ExistingNameCheck[] {
  const layouts = new Map(circuits.flatMap(c => c.layouts.map(l => [l.layout_id, l])));
  const out: ExistingNameCheck[] = [];
  for (const guide of model.guides) for (const section of guide.sections) {
    if (!section.name?.trim()) continue;
    const urls = section.sources.map(key => model.sources[key]).filter(Boolean);
    const texts = urls.map(snapshotText).filter((t): t is string => t !== null);
    const forms = [section.name, ...section.aliases].filter(Boolean);
    // Compound names ("Maggotts–Becketts–Chapel") are found when every component appears in one text.
    const parts = (form: string) => form.split(/\s*(?:[–—/&]|\band\b|-(?=\p{Lu}))\s*/u).filter(p => p.trim().length > 1);
    const found = texts.some(text => forms.some(form => containsPhrase(text, form) || (parts(form).length > 1 && parts(form).every(p => containsPhrase(text, p)))));
    const seasons = layouts.get(guide.layout_id)?.seasons ?? [];
    out.push({
      circuit_id: guide.circuit_id, layout_id: guide.layout_id, section_id: section.id, numbers: section.numbers, name: section.name,
      numbering_year: guide.numbering_year, layout_seasons: seasons.length ? `${seasons[0]}-${seasons.at(-1)}` : '',
      cited_sources: urls.length, live_sources: texts.length,
      status: !urls.length ? 'no_cited_sources' : !texts.length ? 'cited_sources_unavailable' : found ? 'name_found_in_cited_source' : 'name_not_in_cited_text',
      period: !seasons.length ? 'layout_unknown' : guide.numbering_year >= seasons[0] && guide.numbering_year <= seasons.at(-1)! ? 'within_layout_seasons' : 'outside_layout_seasons',
    });
  }
  return out;
}

export type ResearchTask = { circuit_id: string; layout_id: string; seasons: string; turns_to_research: number[]; status: 'not_researched' | 'research_incomplete'; known_source_urls: string[] };

/** Work queue: every turn of every layout that has no evidenced name decision yet. */
export function cornerResearchQueue(model: CornerModel, circuits: readonly ArchiveCircuit[]): ResearchTask[] {
  const guides = new Map(model.guides.map(g => [g.layout_id, g]));
  const incomplete = new Set(['historical_numbering_unverified', 'historical_turn_mapping_ai_checked_independent_review_pending', 'period_numbered_map_unlabelled']);
  const tasks: ResearchTask[] = [];
  for (const circuit of circuits) for (const layout of circuit.layouts) {
    const guide = guides.get(layout.layout_id);
    const urls = guide ? [...new Set(guide.sections.flatMap(s => s.sources.map(k => model.sources[k])).filter(Boolean))] : [];
    if (!guide) { tasks.push({ circuit_id: circuit.circuit_id, layout_id: layout.layout_id, seasons: `${layout.seasons[0]}-${layout.seasons.at(-1)}`, turns_to_research: Array.from({ length: layout.turns }, (_, i) => i + 1), status: 'not_researched', known_source_urls: [] }); continue; }
    const pending = guide.sections.filter(s => incomplete.has(s.confirmation_status)).flatMap(s => s.numbers).sort((a, b) => a - b);
    if (pending.length) tasks.push({ circuit_id: circuit.circuit_id, layout_id: layout.layout_id, seasons: `${layout.seasons[0]}-${layout.seasons.at(-1)}`, turns_to_research: pending, status: 'research_incomplete', known_source_urls: urls });
  }
  return tasks;
}
