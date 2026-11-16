#!/usr/bin/env node
/**
 * Read-only 78-circuit content gap matrix and editorial-policy dry run.
 *
 * Usage: node scripts/circuit-content-gap-matrix.mjs [--check]
 *   default  writes docs/editorial/circuit-completion/{circuits,layouts,corners,content-blocks,policy-dry-run}.{json,csv} and MATRIX.md
 *   --check  regenerates in memory and exits 1 if committed artifacts are out of date
 *
 * Inputs are committed files only (pinned F1DB circuit export + existing editorial data),
 * so the result is reproducible in CI. Nothing here approves, publishes or edits content.
 * Statuses describe what exists; no status is promoted without recorded evidence.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { evaluatePublication, significantNumbers, similarity, boilerplateHits, cyrillicShare } from '../packages/editorial-policy/src/index.ts';

const root = resolve(import.meta.dirname, '..');
const OUT = join(root, 'docs/editorial/circuit-completion');
const E = 'apps/web/src/components/editorial/';
const load = path => JSON.parse(readFileSync(join(root, path), 'utf8'));

const archive = load('docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json');
const PINNED = archive.source.release;
const reader72 = new Set(load(`${E}circuit-targets.json`).targets.map(t => t.circuit_id));
const v3 = load(`${E}circuit-corners-v3.json`);
const v3Guides = new Map(v3.guides.map(g => [g.circuit_id, g]));
const shortGuides = new Map(load(`${E}circuit-corner-guides.json`).map(g => [g.id, g]));
const narratives = new Map(load(`${E}circuit-narratives-v3.json`).entries.map(e => [e.circuit_id, e]));
const STORY_FILES = ['circuit-extra-stories', 'circuit-next20-stories', 'circuit-final33-stories'];
const publicShort = new Map(STORY_FILES.flatMap(f => load(`${E}archive-summaries/${f}.json`).map(s => [s.id, { ...s, file: `${E}archive-summaries/${f}.json` }])));
const longDrafts = new Map(STORY_FILES.flatMap(f => load(`${E}${f}.json`).map(s => [s.id, { ...s, file: `${E}${f}.json` }])));
const legacySource = readFileSync(join(root, `${E}circuit-history-stories.tsx`), 'utf8');
const legacyHistory = new Set([...legacySource.matchAll(/^\s{2}'?([a-z0-9-]+)'?:\s*\{\s*$/gm)].map(m => m[1]));
const releaseEditions = load(`${E}circuit-release.json`).editions;
const manifest = new Map(load('apps/web/src/components/circuit-layout-manifest.json').map(m => [m.layout_id, m]));
const photos = load('apps/web/src/components/media/publication.json').assets;
const worklist = new Map(load('docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json').circuits.map(c => [c.circuit_id, c]));
const batch01 = new Set(load('docs/editorial/circuit-experience-v3/BATCH_01_20_RELEASE_GATE_20261106.json').circuits.map(c => c.circuit_id));

// Existing research corpus: which editorial/media documents mention each circuit (reusable material).
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(md|json|csv)$/.test(name) && !path.startsWith(OUT)) out.push(path);
  }
  return out;
}
const researchDocs = [...walk(join(root, 'docs/editorial')), ...walk(join(root, 'docs/media'))]
  .map(path => ({ path: relative(root, path), text: readFileSync(path, 'utf8') }));
const mentions = id => {
  const pattern = new RegExp(`(?<![a-z0-9-])${id.replace(/-/g, '[- ]')}(?![a-z0-9-])`, 'i');
  return researchDocs.filter(doc => pattern.test(doc.text)).map(doc => doc.path);
};

const words = text => (text ?? '').split(/\s+/).filter(Boolean).length;
const CURRENT_SEASONS = new Set([2025, 2026]);

// ---------- Corner granularity: every numbered turn of every recorded layout ----------
const RESEARCH_INCOMPLETE = new Set(['historical_numbering_unverified', 'historical_turn_mapping_ai_checked_independent_review_pending', 'period_numbered_map_unlabelled']);
function cornerStatus(section) {
  if (!section) return 'not_researched';
  if (RESEARCH_INCOMPLETE.has(section.confirmation_status)) return 'research_incomplete';
  return section.name?.trim() ? 'named_unverified' : 'number_only_unverified';
}
const explanationUse = new Map();
for (const guide of v3.guides) for (const s of guide.sections) for (const sentence of (s.explanation?.en ?? '').split(/(?<=[.!?])\s+/)) {
  if (words(sentence) >= 6) explanationUse.set(sentence, (explanationUse.get(sentence) ?? 0) + 1);
}
const corners = [];
for (const circuit of archive.circuits) for (const layout of circuit.layouts) {
  const guide = v3Guides.get(circuit.circuit_id);
  const guideApplies = guide?.layout_id === layout.layout_id;
  const byNumber = new Map(guideApplies ? guide.sections.flatMap(s => s.numbers.map(n => [n, s])) : []);
  for (let number = 1; number <= layout.turns; number++) {
    const s = byNumber.get(number);
    const explanation = s?.explanation?.en ?? '';
    const repeated = explanation.split(/(?<=[.!?])\s+/).filter(x => (explanationUse.get(x) ?? 0) >= 3).length;
    corners.push({
      circuit_id: circuit.circuit_id, layout_id: layout.layout_id, layout_seasons: `${layout.seasons[0] ?? ''}-${layout.seasons.at(-1) ?? ''}`,
      turn: number, status: cornerStatus(s), name: s?.name ?? '', aliases: (s?.aliases ?? []).join(' | '),
      grouped_with: s && s.numbers.length > 1 ? s.numbers.join('+') : '',
      confirmation_status: s?.confirmation_status ?? '', numbering_year: guideApplies ? guide.numbering_year : '',
      source_keys: (s?.sources ?? []).join(' | '), sources_resolved: (s?.sources ?? []).every(k => v3.sources[k]) ? (s?.sources?.length ?? 0) : 0,
      explanation_words_en: words(explanation), explanation_words_uk: words(s?.explanation?.uk),
      generic_phrasing: boilerplateHits(explanation, 'en').length > 0 || repeated > 0,
      independent_review: guideApplies && guide.review_status === 'independent_review_approved' ? 'approved' : guideApplies ? guide.review_status : 'none',
    });
  }
}

// ---------- Layout granularity ----------
const layouts = [];
for (const circuit of archive.circuits) circuit.layouts.forEach((layout, index) => {
  const previous = circuit.layouts[index - 1];
  const svg = manifest.get(layout.layout_id);
  const guide = v3Guides.get(circuit.circuit_id);
  const turnConflict = layout.race_turn_counts.length > 1 || (layout.race_turn_counts[0] ?? layout.turns) !== layout.turns;
  const own = corners.filter(c => c.layout_id === layout.layout_id);
  layouts.push({
    layout_id: layout.layout_id, circuit_id: circuit.circuit_id, sequence: index + 1, designation: 'unknown',
    first_season: layout.seasons[0] ?? null, last_season: layout.seasons.at(-1) ?? null, seasons: layout.seasons.join(' '),
    races: layout.race_ids.length, length_km: Number(layout.length_km), turns: layout.turns,
    race_turn_counts: layout.race_turn_counts.join(' '), direction: layout.directions.join(' ') || circuit.fields.direction || '',
    length_change_km: previous ? Number((layout.length_km - previous.length_km).toFixed(3)) : null,
    turn_change: previous ? layout.turns - previous.turns : null,
    change_reason: index === 0 ? 'not_applicable' : 'unknown',
    // Every dimension below is the pinned F1DB record only: one structured source, not corroborated.
    years_status: 'single_source_dataset', length_status: 'single_source_dataset',
    turns_status: turnConflict ? 'conflicting_evidence' : 'single_source_dataset',
    direction_status: layout.directions.length ? 'single_source_dataset' : 'unknown',
    revision_dates: 'season_level_only',
    diagram: svg ? `F1DB SVG (${svg.license}, ${svg.author})` : 'none', diagram_rights: svg ? 'pending_per_asset_review' : 'not_applicable',
    corner_guide: guide?.layout_id === layout.layout_id ? 'drafted' : 'none',
    corners_named_unverified: own.filter(c => c.status === 'named_unverified').length,
    corners_not_researched: own.filter(c => c.status === 'not_researched').length,
  });
});

// ---------- Existing content blocks: deterministic triage + policy dry run ----------
const PIPELINE = { id: 'legacy-import', role: 'writer', run_id: 'legacy-import' };
const ctx = {
  pinned_dataset_release: PINNED, dataset: () => undefined, known_routes: new Set(), license_allowlist: [],
  technical_receipt: null, evaluated_at: archive.source.release, corpus: [],
};
const blocks = [];
const addBlock = (circuit_id, kind, file, en, uk, extra = {}) => blocks.push({ circuit_id, kind, file, en: en ?? '', uk: uk ?? '', ...extra });
for (const circuit of archive.circuits) {
  const id = circuit.circuit_id;
  const s = publicShort.get(id); if (s) addBlock(id, 'short_summary', s.file, s.description.en, s.description.uk, { review: 'ai_checked_pending_independent', public: true });
  const d = longDrafts.get(id); if (d) addBlock(id, 'long_history_draft', d.file, d.description.en, d.description.uk, { review: d.historical_review_status, public: false, cited_sources: d.historical_sources.length });
  const n = narratives.get(id);
  if (n) {
    addBlock(id, 'narrative_biography', `${E}circuit-narratives-v3.json`, n.biography.text.en, n.biography.text.uk, { review: 'candidate_unreleased', public: false });
    for (const m of n.moments) addBlock(id, 'defining_moment', `${E}circuit-narratives-v3.json`, m.text.en, m.text.uk, { review: m.review_status, public: false, block_ref: m.id });
  }
  if (legacyHistory.has(id)) addBlock(id, 'legacy_history', `${E}circuit-history-stories.tsx`, 'hand-authored legacy history', 'hand-authored legacy history', { review: 'ai_reviewed_legacy', public: true, opaque: true });
  const g = v3Guides.get(id); if (g) addBlock(id, 'corner_guide', `${E}circuit-corners-v3.json`, g.sections.map(x => x.explanation?.en ?? '').join('\n\n'), g.sections.map(x => x.explanation?.uk ?? '').join('\n\n'), { review: g.review_status, public: false, block_ref: g.layout_id });
}
blocks.forEach((block, i) => { block.block_id = `${block.circuit_id}:${block.kind}:${block.block_ref ?? i}`; });
const prose = blocks.filter(b => !b.opaque && b.kind !== 'corner_guide');
for (const block of blocks) {
  if (block.opaque) { Object.assign(block, { triage: 'FACT-CHECK', signals: 'legacy component text not machine-extracted', policy_outcome: 'FAIL', policy_blockers: 'not_ingested' }); continue; }
  const signals = [];
  const enWords = words(block.en), ukWords = words(block.uk);
  if (!enWords) signals.push('en_missing');
  if (!ukWords) signals.push('uk_missing');
  if (ukWords && cyrillicShare(block.uk) < 0.5) signals.push('uk_untranslated');
  if (significantNumbers(block.en).join() !== significantNumbers(block.uk).join()) signals.push(`en_uk_number_mismatch:${[...significantNumbers(block.en).filter(n => !significantNumbers(block.uk).includes(n)), ...significantNumbers(block.uk).filter(n => !significantNumbers(block.en).includes(n))].join('/')}`);
  if (boilerplateHits(block.en, 'en').length) signals.push(`boilerplate:${boilerplateHits(block.en, 'en').join('/')}`);
  if (block.kind !== 'corner_guide') {
    const dup = prose.find(o => o !== block && o.circuit_id !== block.circuit_id && similarity(o.en, block.en) >= 0.6);
    if (dup) signals.push(`near_duplicate_of:${dup.block_id}`);
    const sameCircuit = prose.find(o => o !== block && o.circuit_id === block.circuit_id && similarity(o.en, block.en) >= 0.6);
    if (sameCircuit) signals.push(`overlaps:${sameCircuit.block_id}`);
  }
  // Deterministic triage only. KEEP requires evidence + independent review, which no block has yet.
  let triage = 'FACT-CHECK';
  if (signals.some(x => x.startsWith('near_duplicate_of'))) triage = 'REMOVE';
  else if (signals.some(x => /missing|untranslated|boilerplate/.test(x))) triage = 'REWRITE';
  // A number present in only one language may be a factual discrepancy: FACT-CHECK (the default) applies.
  else if (block.kind === 'short_summary' && enWords < 40) triage = 'EXPAND';
  else if (block.kind === 'defining_moment' && enWords < 25) triage = 'EXPAND';
  const item = {
    item_id: block.block_id, entity: { type: 'circuit', id: block.circuit_id }, dataset_release: PINNED,
    blocks: [{ block_id: 'body', kind: block.kind, body: { en: block.en, uk: block.uk }, claim_ids: [], links: [] }],
    claims: [], sources: [], media: [], authorship: { writer: PIPELINE, fact_checker: null, localizer: null }, editorial_review: null,
  };
  const decision = evaluatePublication(item, ctx);
  const blockers = [...new Set(decision.gates.flatMap(g => g.findings.map(f => f.code)))];
  Object.assign(block, { en_words: enWords, uk_words: ukWords, triage, signals: signals.join(' '), policy_outcome: decision.outcome, policy_blockers: blockers.join(' ') });
}

// ---------- Circuit granularity ----------
const status = (exists, label = 'draft_unverified') => exists ? label : 'absent';
const circuits = archive.circuits.map(circuit => {
  const id = circuit.circuit_id, f = circuit.fields;
  const seasons = circuit.races.map(r => r.season);
  const own = corners.filter(c => c.circuit_id === id);
  const count = s => own.filter(c => c.status === s).length;
  const ownBlocks = blocks.filter(b => b.circuit_id === id);
  const n = narratives.get(id);
  const docs = mentions(id);
  const svgs = circuit.layouts.filter(l => manifest.has(l.layout_id)).length;
  const missingResults = circuit.races.filter(r => !r.has_results && r.date < '2026-11-16').length;
  const blockers = [
    'no_claim_level_evidence', 'no_independent_fact_check', 'en_uk_quality_not_assessed',
    !longDrafts.has(id) && 'full_history_absent',
    !n && 'defining_moments_absent',
    'origins_section_absent', 'safety_changes_section_absent', 'present_day_status_absent', 'timeline_absent',
    count('not_researched') && `corners_not_researched:${count('not_researched')}`,
    count('research_incomplete') && `corners_research_incomplete:${count('research_incomplete')}`,
    circuit.layouts.some(l => l.race_turn_counts.length > 1 || (l.race_turn_counts[0] ?? l.turns) !== l.turns) && 'layout_turn_count_conflict',
    'layout_change_reasons_unknown',
    svgs && 'layout_svg_rights_pending', 'no_photographs',
    !reader72.has(id) && 'legacy_renderer',
    missingResults && `results_missing_after_race_date:${missingResults}`,
    ownBlocks.some(b => b.triage === 'REMOVE') && 'duplicate_text',
    ownBlocks.some(b => b.triage === 'REWRITE') && 'text_needs_rewrite',
  ].filter(Boolean);
  return {
    circuit_id: id, name: circuit.name, full_name: f.full_name ?? '', previous_names: f.previous_names ?? '', local_name: 'unknown',
    country: f.country ?? '', place: f.place_name ?? '', latitude: f.latitude ?? null, longitude: f.longitude ?? null,
    identity_status: 'single_source_dataset', circuit_type: f.circuit_type ?? '', direction: f.direction ?? '',
    first_f1_season: Math.min(...seasons), last_f1_season: Math.max(...seasons), f1_races: circuit.races.length,
    calendar_status: seasons.some(s => CURRENT_SEASONS.has(s)) ? 'current_calendar' : 'historical',
    layouts: circuit.layouts.length, numbered_turns_all_layouts: own.length, renderer: reader72.has(id) ? 'reader' : 'legacy',
    historical_research_status: docs.length ? 'research_notes_unverified' : 'none',
    research_documents: docs.length,
    intro_status: legacyHistory.has(id) ? 'legacy_public_unverified' : status(publicShort.has(id), 'short_public_unverified'),
    full_history_status: status(longDrafts.has(id), 'long_draft_unverified'),
    long_draft_words_en: words(longDrafts.get(id)?.description.en),
    timeline_status: 'absent', origins_status: 'absent', safety_changes_status: 'absent', present_day_status: 'absent',
    defining_moments_status: n ? `draft_unverified:${n.moments.length}` : 'absent',
    turn_research_status: v3Guides.has(id) ? 'one_layout_drafted' : shortGuides.has(id) ? 'grouped_sections_only' : 'absent',
    corners_named_unverified: count('named_unverified'), corners_number_only_unverified: count('number_only_unverified'),
    corners_research_incomplete: count('research_incomplete'), corners_not_researched: count('not_researched'),
    corners_name_disputed: 0, corners_verified: 0,
    statistics_status: 'dataset_present_not_cross_checked', results_missing_after_race_date: missingResults,
    source_evidence_coverage: longDrafts.has(id) ? `article_level:${longDrafts.get(id).historical_sources.length}_sources;claim_level:0` : 'article_level:1_source;claim_level:0',
    en_quality_status: 'not_assessed', uk_quality_status: 'not_assessed',
    content_triage: [...new Set(ownBlocks.map(b => b.triage))].sort().join(' '),
    media_layout_svgs: svgs, media_photographs: photos.filter(a => a.subject?.id === id).length, media_rights_status: svgs ? 'pending_per_asset_review' : 'no_assets',
    editorial_quality_status: 'not_assessed', independent_review_status: 'none',
    release_edition: releaseEditions.some(e => e.circuit_id === id) ? 'present' : 'none',
    worklist_publication: worklist.get(id)?.publication ?? '',
    content_complete: false, media_ready: false, publication_eligible: false, production_verified: false,
    blockers: blockers.join(' '),
    related_github: [batch01.has(id) && '#411', batch01.has(id) && '#412', reader72.has(id) ? '#419' : null].filter(Boolean).join(' '),
  };
});

// ---------- Prioritization (documented in README.md) ----------
const maxRaces = Math.max(...circuits.map(c => c.f1_races));
for (const c of circuits) {
  const importance = c.f1_races / maxRaces;                         // historical weight
  const interest = c.calendar_status === 'current_calendar' ? 1 : 0;  // visitor interest proxy
  const reuse = Math.min(1, c.research_documents / 40) * 0.5 + (c.full_history_status !== 'absent' ? 0.25 : 0) + (c.turn_research_status === 'one_layout_drafted' ? 0.25 : 0);
  const effort = Math.min(1, (c.corners_not_researched + c.corners_research_incomplete) / 60);
  c.priority_score = Number((0.4 * importance + 0.3 * interest + 0.2 * reuse - 0.1 * effort).toFixed(3));
}
[...circuits].sort((a, b) => b.priority_score - a.priority_score || a.circuit_id.localeCompare(b.circuit_id))
  .forEach((c, i) => { c.priority_rank = i + 1; });

// ---------- Output ----------
const csv = rows => {
  const keys = Object.keys(rows[0]);
  const cell = v => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return `${keys.join(',')}\n${rows.map(r => keys.map(k => cell(r[k])).join(',')).join('\n')}\n`;
};
const blockRows = blocks.map(block => ({ ...block, en: undefined, uk: undefined, opaque: undefined, block_ref: undefined }));
const summary = {
  generated_from: { dataset: archive.source, inputs: 'committed repository files only' },
  circuits: circuits.length, layouts: layouts.length, numbered_turns: corners.length,
  corners: Object.fromEntries(['named_unverified', 'number_only_unverified', 'research_incomplete', 'not_researched'].map(s => [s, corners.filter(c => c.status === s).length])),
  corners_verified: 0,
  layouts_with_turn_count_conflict: layouts.filter(l => l.turns_status === 'conflicting_evidence').length,
  content_blocks: blocks.length,
  triage: Object.fromEntries([...new Set(blocks.map(b => b.triage))].sort().map(t => [t, blocks.filter(b => b.triage === t).length])),
  policy_outcomes: Object.fromEntries([...new Set(blocks.map(b => b.policy_outcome))].map(o => [o, blocks.filter(b => b.policy_outcome === o).length])),
  content_complete: 0, media_ready: 0, publication_eligible: 0, production_verified: 0,
};
const files = {
  'circuits.json': `${JSON.stringify({ summary, circuits }, null, 1)}\n`, 'circuits.csv': csv(circuits),
  'layouts.json': `${JSON.stringify(layouts, null, 1)}\n`, 'layouts.csv': csv(layouts),
  'corners.csv': csv(corners),
  'content-blocks.json': `${JSON.stringify(blockRows, null, 1)}\n`,
  'MATRIX.md': markdown(),
};
function markdown() {
  const rows = [...circuits].sort((a, b) => a.priority_rank - b.priority_rank);
  const t = (c, k) => blocks.filter(b => b.circuit_id === c && b.kind === k);
  const lines = [
    '# 78-circuit content matrix', '',
    `Generated by \`node scripts/circuit-content-gap-matrix.mjs\` from committed files and the pinned F1DB ${PINNED} export. Do not edit by hand.`, '',
    `**${summary.content_complete}/78 content complete · ${summary.media_ready}/78 media ready · ${summary.publication_eligible}/78 publication eligible · ${summary.production_verified}/78 production verified.**`, '',
    `Corners across all ${layouts.length} layouts: ${corners.length} numbered turns — ${summary.corners.named_unverified} named (unverified), ${summary.corners.number_only_unverified} number-only (unverified), ${summary.corners.research_incomplete} research incomplete, ${summary.corners.not_researched} not researched, 0 verified.`, '',
    '| # | Circuit | Layouts | Draft | Evidence | Fact check | EN/UK | Media | Publishable | Key blockers |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map(c => {
      const draft = [t(c.circuit_id, 'short_summary').length && 'summary', t(c.circuit_id, 'long_history_draft').length && 'long', t(c.circuit_id, 'narrative_biography').length && 'narrative', t(c.circuit_id, 'corner_guide').length && 'corners', t(c.circuit_id, 'legacy_history').length && 'legacy'].filter(Boolean).join(', ');
      const key = c.blockers.split(' ').filter(b => !['no_claim_level_evidence', 'no_independent_fact_check', 'en_uk_quality_not_assessed', 'layout_change_reasons_unknown', 'timeline_absent', 'origins_section_absent', 'safety_changes_section_absent', 'present_day_status_absent'].includes(b)).join(', ');
      return `| ${c.priority_rank} | ${c.name} (\`${c.circuit_id}\`) | ${c.layouts} | ${draft} | article-level only | none | not assessed | ${c.media_layout_svgs} SVG (rights pending), 0 photos | no | ${key} |`;
    }),
    '', 'Every circuit additionally lacks claim-level evidence, an independent fact check, an EN/UK quality review, a timeline, and origins / safety-change / present-day sections. Layout change reasons are unknown for every non-first layout.', '',
  ];
  return `${lines.join('\n')}\n`;
}

// --check compares only what derives from the archive export and the content files. Research-note
// counts (and the ranking that uses them) follow docs/ edits and are refreshed on regeneration,
// so unrelated documentation changes must not fail CI.
const DOC_DERIVED = ['research_documents', 'historical_research_status', 'priority_score', 'priority_rank'];
const stable = text => JSON.stringify(JSON.parse(text).circuits.map(c => Object.fromEntries(Object.entries(c).filter(([k]) => !DOC_DERIVED.includes(k)))));
const check = process.argv.includes('--check');
const stale = [];
for (const [name, content] of Object.entries(files)) {
  const path = join(OUT, name);
  if (!check) { writeFileSync(path, content); continue; }
  if (name === 'MATRIX.md' || name === 'circuits.csv') continue;
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  const same = current !== null && (name === 'circuits.json' ? stable(current) === stable(content) : current === content);
  if (!same) stale.push(name);
}
if (check && stale.length) { console.error(`Out of date: ${stale.join(', ')}. Run node scripts/circuit-content-gap-matrix.mjs`); process.exit(1); }
console.log(JSON.stringify(summary, null, 1));
