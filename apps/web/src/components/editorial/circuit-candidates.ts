/** Reuse upstream Monaco/Spa research; configuration reconciliation is separate from approval. */
import monaco from '../../../../../docs/editorial/circuit-experience-v3/monaco-turns-and-moments-v1.json' with { type: 'json' };
import spa from '../../../../../docs/editorial/circuit-experience-v3/spa-turns-v1.json' with { type: 'json' };
import corners from './circuit-corners-v3.json' with { type: 'json' };
import narratives from './circuit-narratives-v3.json' with { type: 'json' };

type RawCircuit = { circuit_id: string; intro: { en: string; uk: string }; turns: {
  number: number; name: string | null; shared_segment: string | null; story: { en: string; uk: string };
}[]; moments: { id: string; year: number; title: { en: string; uk: string };
  narrative: { en: string; uk: string }; sources: string[] }[] };

const inherited = [monaco, spa] as RawCircuit[];
export const candidateCornerSources = corners.sources;
export const candidateCornerGuides = [...inherited.map(raw => {
  const binding = corners.bindings.find(item => item.circuit_id === raw.circuit_id)!;
  const groups = new Map<string, typeof raw.turns>();
  for (const turn of raw.turns) {
    const key = turn.shared_segment ?? `t${turn.number}`;
    groups.set(key, [...(groups.get(key) ?? []), turn]);
  }
  return { ...binding, review_status: 'independent_review_pending', sections: [...groups.values()].map(turns => ({
    id: `${raw.circuit_id}-t${turns[0].number}`, numbers: turns.map(turn => turn.number),
    name: turns[0].name?.split(' — ')[0] ?? null, aliases: ('aliases_by_number' in binding ? (binding.aliases_by_number as Record<string, string[]>)[String(turns[0].number)] : undefined) ?? [], explanation: turns[0].story,
    sources: [`${raw.circuit_id}-map`, `${raw.circuit_id}-names`], confirmation_status: 'source_checked_ai',
  })) };
}), ...corners.guides];

export const candidateCircuitNarratives = [...inherited.map(raw => ({
  circuit_id: raw.circuit_id,
  biography: { title: { en: raw.circuit_id === 'monaco' ? 'The city becomes the circuit' : 'Racing through the Ardennes', uk: raw.circuit_id === 'monaco' ? 'Місто стає трасою' : 'Перегони серед Арденн' }, text: raw.intro, source: raw.moments[0].sources[0], locator: 'Upstream source-backed circuit research' },
  moments: raw.moments.map(moment => ({ id: moment.id, year: moment.year, title: moment.title, text: moment.narrative,
    source: moment.sources[0], locator: `Upstream research / ${moment.id}`, criterion: 'source_selected_historical_milestone',
    review_status: 'independent_review_pending', source_check: 'Inherited source-backed research; not publication approval' })),
})), ...narratives.entries];
