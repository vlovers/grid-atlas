import { candidateCornerGuides, candidateCornerSources } from './circuit-candidates.ts';
import { isCircuitEditionApproved } from './circuit-release.ts';

export type CornerSection = {
  id: string; numbers: number[]; name: string | null; aliases: string[];
  explanation: { en: string; uk: string } | null; sources: string[]; confirmation_status: string;
};
export type CornerGuide = { circuit_id: string; layout_id: string; numbering_year: number; names_as_of: number;
  numbered_turns: number; review_status: string; sections: CornerSection[];
  diagram?: { asset: string; points: { number: number; anchor: number[]; label: number[] }[] } };
export const cornerSources: Record<string, string> = candidateCornerSources;
export const cornerGuides = candidateCornerGuides as CornerGuide[];

/** Never project a modern guide onto a different or unavailable historical layout. */
export function cornerGuideFor(circuitId: string, availableLayouts: readonly string[]) {
  return isCircuitEditionApproved(circuitId) ? cornerGuides.find(guide => guide.circuit_id === circuitId && availableLayouts.includes(guide.layout_id)) ?? null : null;
}

/** Individual turns retain the section name, never an invented unique name. */
export function numberedCorners(guide: CornerGuide) {
  return guide.sections.flatMap(section => section.numbers.map(number => ({
    number, name: section.name, aliases: section.aliases, section_id: section.id,
    layout_id: guide.layout_id, numbering_year: guide.numbering_year,
    explanation: section.explanation, sources: section.sources,
    confirmation_status: section.confirmation_status,
  }))).sort((a, b) => a.number - b.number);
}
