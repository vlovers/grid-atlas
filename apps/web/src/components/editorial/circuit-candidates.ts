/** Reuse upstream Monaco/Spa research; configuration reconciliation is separate from approval. */
import monaco from '../../../../../docs/editorial/circuit-experience-v3/monaco-turns-and-moments-v1.json' with { type: 'json' };
import spa from '../../../../../docs/editorial/circuit-experience-v3/spa-turns-v1.json' with { type: 'json' };
import corners from './circuit-corners-v3.json' with { type: 'json' };
import narratives from './circuit-narratives-v3.json' with { type: 'json' };
import periodRoutes from '../../../../../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json' with { type: 'json' };

type RawCircuit = { circuit_id: string; intro: { en: string; uk: string }; turns: {
  number: number; name: string | null; shared_segment: string | null; story: { en: string; uk: string };
}[]; moments: { id: string; year: number; title: { en: string; uk: string };
  narrative: { en: string; uk: string }; sources: string[] }[] };

const inherited = [monaco, spa] as RawCircuit[];
export const candidateCornerSources = corners.sources;
export const candidateCornerGuides = [...inherited.map(raw => {
  const binding = corners.bindings.find(item => item.circuit_id === raw.circuit_id)!;
  // Keep a separate section and focus target for every numbered bend.
  // Shared names are repeated deliberately; prose and anchors are not.
  return { ...binding, review_status: 'independent_review_pending', sections: raw.turns.map(turn => ({
    id: `${raw.circuit_id}-t${turn.number}`, numbers: [turn.number],
    name: turn.name?.split(' — ')[0] ?? null,
    aliases: ('aliases_by_number' in binding ? (binding.aliases_by_number as Record<string, string[]>)[String(turn.number)] : undefined) ?? [],
    explanation: turn.story,
    sources: [`${raw.circuit_id}-map`, `${raw.circuit_id}-names`],
    confirmation_status: 'source_checked_ai',
  })) };
}), ...corners.guides];

export const candidateCircuitNarratives = [...inherited.map(raw => ({
  circuit_id: raw.circuit_id,
  biography: { title: { en: raw.circuit_id === 'monaco' ? 'The city becomes the circuit' : 'Racing through the Ardennes', uk: raw.circuit_id === 'monaco' ? 'Місто стає трасою' : 'Перегони серед Арденн' }, text: raw.intro, source: raw.moments[0].sources[0], locator: 'Upstream source-backed circuit research' },
  moments: raw.moments.map(moment => ({ id: moment.id, year: moment.year, title: moment.title, text: moment.narrative,
    source: moment.sources[0], locator: `Upstream research / ${moment.id}`, criterion: 'source_selected_historical_milestone',
    review_status: 'independent_review_pending', source_check: 'Inherited source-backed research; not publication approval' })),
})), ...narratives.entries];

/**
 * Seven unnumbered period-route studies already researched in the editorial dossier.
 * These are geographical reading sequences, NOT additional turn guides: no
 * historical apex-number crosswalk or individual corner-name approval exists.
 * Keep them out of candidateCornerGuides and the publication digest until each
 * numbered apex can be matched to a dated source for its exact layout.
 */
const unnumberedRouteIds = new Set([
  'ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring',
]);
export const candidateUnnumberedHistoricalRoutes = periodRoutes.circuits
  .filter(route => unnumberedRouteIds.has(route.circuit_id))
  .map(route => ({
    circuit_id: route.circuit_id,
    layout_id: route.layout_id,
    review_status: 'independent_review_pending' as const,
    numbered_apex_verified: false as const,
    route_scope: 'route_scope' in route ? route.route_scope : null,
    media_rights: 'media_rights' in route ? route.media_rights : null,
    named_bend_studies: 'named_bend_studies' in route && Array.isArray(route.named_bend_studies)
      ? route.named_bend_studies : [],
    period_bend_studies: 'period_bend_studies' in route && Array.isArray(route.period_bend_studies)
      ? route.period_bend_studies : [],
    sections: route.sections.map(section => ({
      section_kind: 'section_kind' in section ? section.section_kind : 'route_geography',
      reading_order: section.reading_order,
      label: section.label,
      explanation: section.description,
      official_turn_numbers: null,
      source_urls: section.source_urls,
      source_roles: 'provenance_scope' in section && section.provenance_scope
        ? section.provenance_scope.source_roles
        : section.source_urls.map(url => ({ url, role: 'historical_context_not_apex_mapping' })),
      geometric_anchor_verified: false as const,
      numbered_apex_verified: false as const,
    })),
  }));

/** Only geographic reading sections belong to the route itself; race episodes
 * and layout notes are preserved separately, never counted as corner evidence. */
export const candidateUnnumberedGeographicRoutes = candidateUnnumberedHistoricalRoutes.map(route => ({
  ...route,
  sections: route.sections.filter(section => section.section_kind === 'route_geography'),
}));

/** Venue-attested names on the historical route, without certified period apex numbers.
 * These never enter candidateCornerGuides or the publication projection. */
export const candidateUnnumberedNamedBendStudies = candidateUnnumberedHistoricalRoutes.flatMap(route =>
  route.named_bend_studies.map(bend => ({ ...bend, circuit_id: route.circuit_id, layout_id: route.layout_id })),
);

/** Individually described historical bends from a period report. The sequence
 * is not a FIA turn-number map and is never part of the publication digest. */
export const candidateUnnumberedPeriodBendStudies = candidateUnnumberedHistoricalRoutes.flatMap(route =>
  route.period_bend_studies.map(bend => ({ ...bend, circuit_id: route.circuit_id, layout_id: route.layout_id })),
);


/**
 * Route order is NOT insertion order: Dallas's closing bend was researched
 * first, while Porto and Pescara received later additions for earlier parts
 * of the lap. Preserve source research_order, but derive a stable route reading
 * order from the parent geographical section. Neither ordinal is a FIA number.
 */
export const candidateUnnumberedPeriodBendsInLapOrder = candidateUnnumberedHistoricalRoutes.flatMap(route =>
  [...route.period_bend_studies]
    .sort((a, b) => a.parent_route_section_order - b.parent_route_section_order || a.reading_order - b.reading_order)
    .map((bend, index) => ({
      ...bend,
      circuit_id: route.circuit_id,
      layout_id: route.layout_id,
      source_research_order: bend.reading_order,
      lap_study_order: index + 1,
      lap_study_label: {
        en: 'Route study ' + (index + 1) + ' (not an FIA turn number)',
        uk: 'Дослідницька позиція ' + (index + 1) + ' (не номер повороту FIA)',
      },
      official_turn_number: null,
      numbered_apex_verified: false as const,
      publication_allowed: false as const,
    })),
);

/**
 * One fail-closed editorial review queue for 53 period bend descriptions and
 * 13 named historical features. It is not a public guide or a review receipt.
 * Race classifications are preserved as context, never as apex-map evidence.
 */
export const candidateHistoricalCornerReviewQueue = [
  ...candidateUnnumberedNamedBendStudies.map(feature => ({
    review_id: feature.circuit_id + ':named:' + feature.reading_order,
    research_kind: 'named_feature' as const,
    circuit_id: feature.circuit_id,
    layout_id: feature.layout_id,
    feature_kind: feature.feature_kind,
    label: { en: feature.name, uk: feature.name },
    explanation: feature.explanation,
    // The primary article may attest the name; additional route links do not
    // automatically corroborate that name or provide a numbered period map.
    source_roles: feature.source_urls.map((url, index) => ({
      url,
      role: index === 0 ? feature.source_role : 'supplementary_route_context_not_independent_name_or_number_verification',
    })),
    source_locator: null,
    official_turn_number: null,
    geometric_anchor_verified: false as const,
    numbered_apex_verified: false as const,
    independent_review_pending: true as const,
    media_rights_approved: false as const,
    publication_allowed: false as const,
  })),
  ...candidateUnnumberedPeriodBendsInLapOrder.map(bend => ({
    review_id: bend.circuit_id + ':period:' + bend.source_research_order,
    research_kind: 'period_bend' as const,
    circuit_id: bend.circuit_id,
    layout_id: bend.layout_id,
    feature_kind: bend.geometry_kind,
    label: bend.label,
    explanation: bend.explanation,
    source_roles: bend.source_roles,
    // A report URL alone is not a pinpoint citation for an individual bend.
    source_locator: 'source_locator' in bend && typeof bend.source_locator === 'string'
      ? bend.source_locator : null,
    lap_study_order: bend.lap_study_order,
    source_research_order: bend.source_research_order,
    official_turn_number: null,
    geometric_anchor_verified: false as const,
    numbered_apex_verified: false as const,
    independent_review_pending: true as const,
    media_rights_approved: false as const,
    publication_allowed: false as const,
  })),
];
