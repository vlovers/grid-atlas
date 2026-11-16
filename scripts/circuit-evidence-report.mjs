#!/usr/bin/env node
/**
 * Milestone B evidence report for all 78 circuits. Read-only over repository content.
 *
 * Usage: node scripts/circuit-evidence-report.mjs [--check]
 *
 * Writes docs/editorial/circuit-evidence/:
 *   claims.json, dataset-checks.json, quality.json, sources.json, corner-research-queue.json
 *        — derived only from committed files; --check requires them to be byte-identical.
 *   factcheck-tasks.json, corner-names.json, completeness.json, COMPLETENESS.md, pilot/*.json
 *        — also use local source snapshots (.grid-atlas/source-snapshots, git-ignored) and
 *          source-status.json. They store hashes and offsets only, never third-party text.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  F1dbIndex, assessCorpus, buildRegistry, buildTask, checkCandidate, checkExistingNames, cornerResearchQueue,
  extractClaims, loadCorpus, sourceId,
} from '../packages/editorial-evidence/src/index.ts';
import { sha256 } from '../packages/editorial-policy/src/index.ts';

const root = resolve(import.meta.dirname, '..');
const OUT = join(root, 'docs/editorial/circuit-evidence');
const SNAPSHOTS = join(root, '.grid-atlas/source-snapshots');
const PILOT = ['monaco', 'silverstone', 'interlagos', 'lusail', 'brands-hatch', 'pescara', 'dallas'];
const archive = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json'), 'utf8'));
const index = new F1dbIndex(archive);
const corpus = loadCorpus(root);
const statusPath = join(OUT, 'source-status.json');
const sourceStatus = existsSync(statusPath) ? JSON.parse(readFileSync(statusPath, 'utf8')) : {};

// ---- Snapshot-independent analysis ----
const claims = corpus.blocks.filter(b => b.kind !== 'corner_group' || b.en.trim()).flatMap(extractClaims);
const checks = new Map(claims.map(c => [c.claim_id, checkCandidate(c, index)]));
const quality = assessCorpus(corpus.blocks);
const registry = buildRegistry(corpus.blocks, archive.source.release);
const queue = cornerResearchQueue(corpus.corners, archive.circuits);

// ---- Snapshot-dependent analysis (local only) ----
const LIVE = new Set(['live', 'live_thin_or_scripted']);
const snapshotText = url => {
  const row = sourceStatus[sourceId(url)];
  if (!row || !LIVE.has(row.outcome) || !row.text_sha256) return null;
  const path = join(SNAPSHOTS, `${row.text_sha256}.txt`);
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');
  return sha256(text) === row.text_sha256 ? text : null;
};
const snapshotsAvailable = Object.values(sourceStatus).some(row => row.text_sha256 && existsSync(join(SNAPSHOTS, `${row.text_sha256}.txt`)));
const blocksById = new Map(corpus.blocks.map(b => [b.block_id, b]));
const docCache = new Map();
const docsFor = block => {
  if (!docCache.has(block.block_id)) docCache.set(block.block_id, block.cited_urls.flatMap(url => {
    const text = snapshotText(url);
    return text ? [{ source_id: sourceId(url), url, text }] : [];
  }));
  return docCache.get(block.block_id);
};
const tasks = claims.map(c => {
  const block = blocksById.get(c.block_id);
  const task = buildTask(c, checks.get(c.claim_id), docsFor(block), block.cited_urls.length);
  // Store a locator, not the third-party sentence: source, passage hash and character offset.
  task.passages = task.passages.map(p => {
    const doc = docsFor(block).find(d => d.source_id === p.source_id);
    const raw = p.text.replace(/…$/, '');
    return { source_id: p.source_id, passage_sha256: sha256(raw), offset: doc ? doc.text.indexOf(raw) : -1, numbers_covered: p.numbers_covered, names_matched: p.names_matched, score: p.score };
  });
  return task;
});
const names = checkExistingNames(corpus.corners, archive.circuits, snapshotText);

// ---- Completeness per circuit ----
const ORIGINS = /\b(?:opened|built|constructed|designed|founded|inaugurat\w*|first (?:race|event|meeting)|laid out)\b/i;
const EVOLUTION = /\b(?:chicane|re-?profil\w*|reconfigur\w*|shortened|lengthened|new layout|layout (?:was )?changed|redesign\w*|resurfac\w*|by-?pass\w*|realigned)\b/i;
const PRESENT = /\b(?:today|remains|no longer|last hosted|returned|still|currently|demolished|closed|now (?:a|used|hosts))\b/i;
const OUTCOMES = ['live', 'live_thin_or_scripted', 'live_pdf_no_text', 'robots_disallowed', 'gone', 'http_error', 'unreachable', 'invalid_url', 'not_checked'];
const completeness = archive.circuits.map(circuit => {
  const id = circuit.circuit_id;
  const blocks = corpus.blocks.filter(b => b.circuit_id === id);
  const prose = blocks.filter(b => !b.kind.startsWith('corner'));
  const proseText = prose.map(b => b.en).join(' ');
  const own = claims.filter(c => c.circuit_id === id);
  const ownTasks = tasks.filter(t => t.circuit_id === id);
  const ownChecks = own.flatMap(c => checks.get(c.claim_id));
  const sources = registry.filter(r => r.circuits.includes(id));
  const outcome = r => sourceStatus[r.source_id]?.outcome ?? 'not_checked';
  const turns = circuit.layouts.reduce((s, l) => s + l.turns, 0);
  const guide = corpus.corners.guides.find(g => g.circuit_id === id);
  const ownNames = names.filter(n => n.circuit_id === id);
  const q = quality.filter(r => r.circuit_id === id);
  const has = kind => blocks.some(b => b.kind === kind);
  const moments = blocks.filter(b => b.kind === 'defining_moment' || b.kind === 'legacy_moment');
  const sections = {
    introduction: has('short_summary') || has('legacy_history') || has('narrative_biography') ? 'draft' : 'absent',
    essential_facts: 'dataset_only',
    origins: ORIGINS.test(proseText) ? 'mentioned_in_draft' : 'absent',
    formula1_history: has('long_history_draft') ? 'draft' : 'absent',
    defining_moments: moments.length ? `draft:${moments.length}` : 'absent',
    layout_evolution: circuit.layouts.length === 1 ? 'not_applicable' : EVOLUTION.test(proseText) ? 'mentioned_in_draft' : 'absent',
    corners: guide ? `one_layout_drafted:${guide.sections.flatMap(s => s.numbers).length}/${turns}` : blocks.some(b => b.kind === 'corner_group') ? 'grouped_sections_only' : 'absent',
    important_races: moments.filter(m => /^\d{4}$/.test(m.year_label ?? '') && index.racesIn(id, Number(m.year_label)).length === 1).length ? 'draft' : 'absent',
    records_statistics: 'dataset_only',
    legacy_present_day: PRESENT.test(proseText) ? 'mentioned_in_draft' : 'absent',
    related_people: 'dataset_only',
    sources_methodology: sources.length ? 'cited' : 'absent',
  };
  const count = (list, pred) => list.filter(pred).length;
  return {
    circuit_id: id, name: circuit.name, pilot: PILOT.includes(id), layouts: circuit.layouts.length,
    sections_with_editorial_text: Object.values(sections).filter(v => /^(draft|mentioned|one_layout|grouped)/.test(v)).length,
    sections,
    claims: own.length,
    claims_by_type: Object.fromEntries(['statistic', 'dated_event', 'measurement', 'quotation', 'interpretation', 'narrative'].map(t => [t, count(own, c => c.claim_type === t)])),
    claims_unaligned_uk: count(own, c => c.alignment === 'unaligned'),
    dataset_checks: { supported: count(ownChecks, k => k.status === 'supported'), conflict: count(ownChecks, k => k.status === 'conflict'), unmatched: count(ownChecks, k => k.status === 'unmatched') },
    factcheck_status: Object.fromEntries(['dataset_conflict', 'dataset_supported', 'passages_cover_numbers', 'passages_partial', 'no_passage_in_live_sources', 'cited_sources_unavailable', 'no_cited_sources'].map(s => [s, count(ownTasks, t => t.status === s)])),
    claims_verified: 0,
    sources: Object.fromEntries([['cited', sources.length], ...OUTCOMES.map(o => [o, count(sources, r => outcome(r) === o)])].filter(([k, v]) => k === 'cited' || v)),
    source_structural_issues: count(sources, r => r.issues.some(i => !i.startsWith('tertiary'))),
    corners: {
      numbered_turns_all_layouts: turns, layouts_with_guide: guide ? 1 : 0, named_in_guide: ownNames.length,
      names_found_in_cited_source: count(ownNames, n => n.status === 'name_found_in_cited_source'),
      names_not_in_cited_text: count(ownNames, n => n.status === 'name_not_in_cited_text'),
      names_sources_unavailable: count(ownNames, n => n.status === 'cited_sources_unavailable'),
      turns_queued: queue.filter(t => t.circuit_id === id).reduce((s, t) => s + t.turns_to_research.length, 0),
    },
    quality: {
      blocks: q.length, shallow: count(q, r => r.flags.some(f => f.startsWith('shallow'))), repetitive: count(q, r => r.flags.some(f => f.startsWith('repetitive'))),
      generic: count(q, r => r.flags.some(f => f.startsWith('generic'))), en_uk_issues: count(q, r => r.en_uk.length > 0),
    },
    /** Share of claims that have a lead (dataset support or a passage containing all their numbers). Not verification. */
    evidence_lead_rate: own.length ? Number((count(ownTasks, t => t.status === 'dataset_supported' || t.status === 'passages_cover_numbers') / own.length).toFixed(3)) : 0,
    content_complete: false,
  };
});

// ---- Output ----
const json = value => `${JSON.stringify(value, null, 1)}\n`;
/** Large arrays: one compact record per line — small, and diffs stay line-per-record. */
const rows = list => `[\n${list.map(item => JSON.stringify(item)).join(',\n')}\n]\n`;
const sum = (key, pick) => completeness.reduce((s, c) => s + pick(c), 0);
const totals = {
  circuits: completeness.length, blocks: corpus.blocks.length, claims: claims.length,
  dataset_supported: sum('', c => c.dataset_checks.supported), dataset_conflicts: sum('', c => c.dataset_checks.conflict), dataset_unmatched: sum('', c => c.dataset_checks.unmatched),
  claims_with_lead: sum('', c => c.factcheck_status.dataset_supported + c.factcheck_status.passages_cover_numbers),
  claims_verified: 0, sources_cited: registry.length,
  sources_live: Object.values(sourceStatus).filter(r => LIVE.has(r.outcome) || r.outcome === 'live_pdf_no_text').length,
  named_corners: names.length, names_found_in_cited_source: names.filter(n => n.status === 'name_found_in_cited_source').length,
  names_not_in_cited_text: names.filter(n => n.status === 'name_not_in_cited_text').length,
  turns_queued: queue.reduce((s, t) => s + t.turns_to_research.length, 0),
  blocks_shallow: quality.filter(r => r.flags.some(f => f.startsWith('shallow'))).length,
  blocks_repetitive: quality.filter(r => r.flags.some(f => f.startsWith('repetitive'))).length,
  blocks_en_uk_issues: quality.filter(r => r.en_uk.length).length,
  content_complete: 0, snapshots_available: snapshotsAvailable,
};
const stable = {
  'claims.json': rows(claims.map(c => ({ claim_id: c.claim_id, block_id: c.block_id, circuit_id: c.circuit_id, kind: c.kind, claim_type: c.claim_type, importance: c.importance, alignment: c.alignment, provenance: c.provenance }))),
  'dataset-checks.json': rows(claims.flatMap(c => checks.get(c.claim_id).map(k => ({ claim_id: c.claim_id, ...k })))),
  'quality.json': rows(quality),
  'sources.json': rows(registry),
  'corner-research-queue.json': json(queue),
};
const local = {
  'factcheck-tasks.json': rows(tasks.map(t => ({ ...t, en: undefined, uk: undefined }))),
  'corner-names.json': rows(names),
  'completeness.json': json({ totals, circuits: completeness }),
  'COMPLETENESS.md': markdown(),
};
for (const id of PILOT) local[`pilot/${id}.json`] = json({
  circuit_id: id, completeness: completeness.find(c => c.circuit_id === id),
  tasks: tasks.filter(t => t.circuit_id === id), corner_names: names.filter(n => n.circuit_id === id),
  corner_queue: queue.filter(t => t.circuit_id === id), quality: quality.filter(q => q.circuit_id === id && (q.flags.length || q.en_uk.length)),
  sources: registry.filter(r => r.circuits.includes(id)).map(r => ({ ...r, status: sourceStatus[r.source_id] ?? null })),
});

function markdown() {
  const rows = [...completeness].sort((a, b) => Number(b.pilot) - Number(a.pilot) || a.circuit_id.localeCompare(b.circuit_id));
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');
  return [
    '# Circuit evidence and completeness report (Milestone B)', '',
    `Generated by \`node scripts/circuit-evidence-report.mjs\` against F1DB ${archive.source.release}. Do not edit by hand.`, '',
    `**Verified claims: ${totals.claims_verified}/${totals.claims}. Content complete: ${totals.content_complete}/78.** No fact-check verdicts have been recorded yet; everything below measures readiness for verification, not verification.`, '',
    '| Measure | Value |', '|---|---|',
    `| Existing blocks ingested (no rewriting) | ${totals.blocks} |`,
    `| Claim candidates (one per English sentence) | ${totals.claims} |`,
    `| Dataset checks supported / conflict / undecidable | ${totals.dataset_supported} / ${totals.dataset_conflicts} / ${totals.dataset_unmatched} |`,
    `| Claims with an evidence lead (dataset support or a cited passage containing all their numbers) | ${totals.claims_with_lead} (${pct(totals.claims_with_lead, totals.claims)}) |`,
    `| Cited sources: live / total | ${totals.sources_live} / ${totals.sources_cited} |`,
    `| Existing corner names found in their own cited source text | ${totals.names_found_in_cited_source} / ${totals.named_corners} |`,
    `| Corner names not shown by their cited source text (needs a better source, not necessarily wrong) | ${totals.names_not_in_cited_text} |`,
    `| Numbered turns queued for name research | ${totals.turns_queued} |`,
    `| Blocks flagged shallow / repetitive / with EN–UK issues | ${totals.blocks_shallow} / ${totals.blocks_repetitive} / ${totals.blocks_en_uk_issues} |`,
    '',
    '| Circuit | Pilot | Sections with text /12 | Claims | Dataset ✓/✗ | Lead rate | Sources live/cited | Names found/named | Turns queued | Shallow | EN–UK |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map(c => `| \`${c.circuit_id}\` | ${c.pilot ? '★' : ''} | ${c.sections_with_editorial_text} | ${c.claims} | ${c.dataset_checks.supported}/${c.dataset_checks.conflict} | ${Math.round(c.evidence_lead_rate * 100)}% | ${(c.sources.live ?? 0) + (c.sources.live_thin_or_scripted ?? 0) + (c.sources.live_pdf_no_text ?? 0)}/${c.sources.cited} | ${c.corners.names_found_in_cited_source}/${c.corners.named_in_guide} | ${c.corners.turns_queued} | ${c.quality.shallow} | ${c.quality.en_uk_issues} |`),
    '',
  ].join('\n');
}

const check = process.argv.includes('--check');
const stale = [];
mkdirSync(join(OUT, 'pilot'), { recursive: true });
for (const [name, content] of Object.entries(stable)) {
  const path = join(OUT, name);
  if (check) { if (!existsSync(path) || readFileSync(path, 'utf8') !== content) stale.push(name); }
  else writeFileSync(path, content);
}
if (!check) {
  if (!snapshotsAvailable) console.error('Local source snapshots not found: snapshot-dependent files left unchanged. Run scripts/source-fetch.mjs first.');
  else for (const [name, content] of Object.entries(local)) writeFileSync(join(OUT, name), content);
}
if (stale.length) { console.error(`Out of date: ${stale.join(', ')}. Run node scripts/circuit-evidence-report.mjs`); process.exit(1); }
console.log(JSON.stringify(totals, null, 1));
