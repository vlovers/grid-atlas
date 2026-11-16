/**
 * Read every existing circuit content source as-is. Nothing is regenerated or edited: each
 * block keeps its file, JSON path, original text and the URLs it already cites.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentSource } from './claims.ts';

const E = 'apps/web/src/components/editorial/';
const STORY_FILES = ['circuit-extra-stories', 'circuit-next20-stories', 'circuit-final33-stories'];
type Localized = { en: string; uk: string };

export type CornerSection = {
  id: string; numbers: number[]; name: string | null; aliases: string[]; explanation: Localized | null;
  sources: string[]; confirmation_status: string;
};
export type CornerGuide = { circuit_id: string; layout_id: string; numbering_year: number; names_as_of: number; numbered_turns: number; review_status: string; sections: CornerSection[] };
export type CornerModel = { sources: Record<string, string>; guides: CornerGuide[] };

export type Corpus = {
  blocks: ContentSource[];
  corners: CornerModel;
  /** Circuits whose content lives in the legacy hand-authored TSX histories. */
  legacy: string[];
};

const urls = (...values: unknown[]) => [...new Set(values.flat(2).flatMap(v =>
  typeof v === 'string' ? [v] : v && typeof v === 'object' && 'url' in v ? [String((v as { url: unknown }).url)] : []).filter(u => /^https?:\/\//.test(u)))];

/**
 * The legacy histories are a plain object literal in a TSX module. It is our own checked-in
 * source (already executed by the app), so the literal is evaluated in isolation without imports.
 */
function legacyHistories(root: string): Record<string, { en: LegacyStory; uk: LegacyStory }> {
  const source = readFileSync(join(root, `${E}circuit-history-stories.tsx`), 'utf8');
  const start = source.indexOf('= {', source.indexOf('const history')) + 2;
  const end = source.indexOf('\n};', start) + 2;
  return new Function(`return (${source.slice(start, end)});`)();
}
type LegacyStory = { title: string; introduction: string; moments: { year: string; title: string; description: string; url: string }[] };

export function loadCorpus(root: string): Corpus {
  const load = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const blocks: ContentSource[] = [];
  for (const f of STORY_FILES) {
    const summaries = load(`${E}archive-summaries/${f}.json`) as { id: string; description: Localized; source: string; year: string }[];
    summaries.forEach((s, i) => blocks.push({ block_id: `${s.id}:short_summary`, circuit_id: s.id, kind: 'short_summary', file: `${E}archive-summaries/${f}.json`,
      json_path: `[${i}].description`, en: s.description.en, uk: s.description.uk, cited_urls: urls(s.source), year_label: s.year }));
    const drafts = load(`${E}${f}.json`) as { id: string; description: Localized; source: string; historical_sources: string[]; background_source_url?: string; year: string }[];
    drafts.forEach((d, i) => blocks.push({ block_id: `${d.id}:long_history_draft`, circuit_id: d.id, kind: 'long_history_draft', file: `${E}${f}.json`,
      json_path: `[${i}].description`, en: d.description.en, uk: d.description.uk, cited_urls: urls(d.historical_sources, d.source, d.background_source_url), year_label: d.year }));
  }
  const narratives = load(`${E}circuit-narratives-v3.json`).entries as { circuit_id: string; biography: { text: Localized; source: string }; moments: { id: string; year: number; text: Localized; source: string; supporting_sources?: unknown[] }[] }[];
  narratives.forEach((n, i) => {
    blocks.push({ block_id: `${n.circuit_id}:narrative_biography`, circuit_id: n.circuit_id, kind: 'narrative_biography', file: `${E}circuit-narratives-v3.json`,
      json_path: `entries[${i}].biography.text`, en: n.biography.text.en, uk: n.biography.text.uk, cited_urls: urls(n.biography.source), year_label: null });
    n.moments.forEach((m, j) => blocks.push({ block_id: `${n.circuit_id}:moment:${m.id}`, circuit_id: n.circuit_id, kind: 'defining_moment', file: `${E}circuit-narratives-v3.json`,
      json_path: `entries[${i}].moments[${j}].text`, en: m.text.en, uk: m.text.uk, cited_urls: urls(m.source, m.supporting_sources ?? []), year_label: String(m.year) }));
  });
  const legacy = legacyHistories(root);
  for (const [id, story] of Object.entries(legacy)) {
    blocks.push({ block_id: `${id}:legacy_introduction`, circuit_id: id, kind: 'legacy_history', file: `${E}circuit-history-stories.tsx`,
      json_path: `history.${id}.{en,uk}.introduction`, en: story.en.introduction, uk: story.uk.introduction, cited_urls: [], year_label: null });
    story.en.moments.forEach((m, j) => blocks.push({ block_id: `${id}:legacy_moment:${j}`, circuit_id: id, kind: 'legacy_moment', file: `${E}circuit-history-stories.tsx`,
      json_path: `history.${id}.{en,uk}.moments[${j}].description`, en: m.description, uk: story.uk.moments[j]?.description ?? '', cited_urls: urls(m.url, story.uk.moments[j]?.url), year_label: m.year }));
  }
  const corners = load(`${E}circuit-corners-v3.json`) as CornerModel;
  corners.guides.forEach((g, i) => g.sections.forEach((s, j) => blocks.push({
    block_id: `${g.circuit_id}:corner:${s.id}`, circuit_id: g.circuit_id, kind: 'corner_section', file: `${E}circuit-corners-v3.json`,
    json_path: `guides[${i}].sections[${j}].explanation`, en: s.explanation?.en ?? '', uk: s.explanation?.uk ?? '',
    cited_urls: urls(s.sources.map(key => corners.sources[key])), year_label: String(g.numbering_year),
  })));
  const grouped = load(`${E}circuit-corner-guides.json`) as { id: string; sections: { label: string; en: string; uk: string; source?: string; comparison_source?: string }[] }[];
  grouped.forEach((g, i) => g.sections.forEach((s, j) => blocks.push({
    block_id: `${g.id}:corner_group:${j}`, circuit_id: g.id, kind: 'corner_group', file: `${E}circuit-corner-guides.json`,
    json_path: `[${i}].sections[${j}]`, en: s.en, uk: s.uk, cited_urls: urls(s.source, s.comparison_source), year_label: null,
  })));
  return { blocks, corners, legacy: Object.keys(legacy) };
}
