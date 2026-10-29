#!/usr/bin/env node
/**
 * Deterministic, read-only claim-review queue for the 165 unpublished circuit
 * research stories. Produces reviewer prompts, never approval decisions.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const raw = execFileSync(process.execPath, ['scripts/export-circuit-expansion-review.mjs', '--format=json'], {
  cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
});
const source = JSON.parse(raw);
assert.equal(source.kind, 'offline_editorial_review_only');
assert.equal(source.publication_allowed, false);
assert.equal(source.independent_approval, false);
assert.equal(source.summary.circuits, 33);
assert.equal(source.summary.stories, 165);

const segmenters = Object.fromEntries(['en', 'uk'].map(locale => [
  locale, new Intl.Segmenter(locale, { granularity: 'sentence' }),
]));
const sentences = (text, locale) => [...segmenters[locale].segment(text)]
  .map(part => part.segment.trim()).filter(Boolean);

/** A number comparison is a *review hint*, not a semantic translation test. */
function numerals(text) {
  return [...text.matchAll(/\d+(?:[.,]\d+)?/gu)]
    .map(match => match[0].replace(',', '.'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}
const differences = (a, b) => ({
  only_en: a.filter((item, i) => a.indexOf(item) === i && !b.includes(item)),
  only_uk: b.filter((item, i) => b.indexOf(item) === i && !a.includes(item)),
});
const reviewChecks = [
  { key: 'classification', prompt: 'Check each claimed position, team, lap count and result against the exact event classification.' },
  { key: 'historical_context', prompt: 'Corroborate non-classification claims with event-specific independent evidence; identify unsupported interpretation.' },
  { key: 'bilingual_meaning', prompt: 'Read the complete EN and UK passages; verify names, dates, quantities, nuance and omissions.' },
  { key: 'circuit_identity', prompt: 'Verify circuit identity, era and configuration; never infer historical turns from modern maps.' },
  { key: 'editorial_quality', prompt: 'Confirm the story is distinct, readable and appropriately sourced, not a repackaged result row.' },
];

const entries = source.circuits.flatMap(circuit => circuit.stories.map(story => {
  assert.equal(story.publication_allowed, false);
  assert.equal(story.independent_approval, false);
  const sourceKinds = story.sources.map(item => item.kind);
  const classificationOnly = sourceKinds.every(kind =>
    kind === 'race_classification' || kind === 'results_index_or_award');
  const raceYears = story.sources.flatMap(item =>
    [...item.url.matchAll(/\/en\/results\/(\d{4})\/races\/\d+\//g)].map(match => Number(match[1])));
  const yearScopeMismatch = raceYears.length > 0 && !raceYears.includes(story.year);
  const numberDiff = differences(numerals(story.narrative.en), numerals(story.narrative.uk));
  const numeralMismatch = numberDiff.only_en.length > 0 || numberDiff.only_uk.length > 0;
  const flags = [
    ...(circuit.unique_source_urls === 1 ? ['single_source_dossier'] : []),
    ...(classificationOnly ? ['classification_only_sources'] : []),
    ...(yearScopeMismatch ? ['race_source_year_mismatch'] : []),
    ...(numeralMismatch ? ['bilingual_numeral_difference'] : []),
    ...(sourceKinds.includes('other_source') ? ['other_source_needs_provenance'] : []),
  ];
  const riskScore = (circuit.unique_source_urls === 1 ? 5 : 0) +
    (classificationOnly ? 3 : 0) + (yearScopeMismatch ? 3 : 0) +
    (numeralMismatch ? 2 : 0) + (sourceKinds.includes('other_source') ? 1 : 0);
  return {
    key: circuit.circuit_id + ':' + story.story_index,
    circuit_id: circuit.circuit_id,
    story_index: story.story_index,
    year: story.year,
    draft_fingerprint_sha256: story.fingerprint_sha256,
    title: story.title,
    narrative: story.narrative,
    source_urls: story.sources.map(item => item.url),
    source_kinds: sourceKinds,
    dossier_unique_source_urls: circuit.unique_source_urls,
    risk_score: riskScore,
    flags,
    numerical_comparison: numberDiff,
    sentence_candidates: {
      en: sentences(story.narrative.en, 'en'),
      uk: sentences(story.narrative.uk, 'uk'),
    },
    // Sentences are candidate review units, not independently validated atomic claims.
    checks: reviewChecks.map(check => ({ ...check, status: 'pending', evidence_locator: null })),
    reviewer_decision: 'not_recorded',
    independently_verified: false,
    publication_allowed: false,
  };
})).sort((a, b) => b.risk_score - a.risk_score ||
  a.circuit_id.localeCompare(b.circuit_id) || a.story_index - b.story_index);

assert.equal(entries.length, 165);
assert.equal(new Set(entries.map(entry => entry.key)).size, 165);
const summary = {
  circuits: 33,
  stories: entries.length,
  single_source_dossiers: source.summary.single_source_circuits,
  classification_only_stories: entries.filter(entry => entry.flags.includes('classification_only_sources')).length,
  bilingual_numeral_review_candidates: entries.filter(entry => entry.flags.includes('bilingual_numeral_difference')).length,
  race_year_review_candidates: entries.filter(entry => entry.flags.includes('race_source_year_mismatch')).length,
  independently_verified: 0,
  publication_ready: 0,
};
const queue = {
  schema_version: 1,
  kind: 'offline_claim_review_queue',
  f1db_release: source.f1db_release,
  source_packet: 'scripts/export-circuit-expansion-review.mjs',
  publication_allowed: false,
  independent_approval: false,
  limitations: [
    'Flags are deterministic heuristics, not factual findings.',
    'Sentence candidates are not atomic claims or approved translations.',
    'The draft fingerprint is not a human signature or publication digest.',
    'No source URL is fetched; source relevance and independence require human review.',
  ],
  summary,
  entries,
};

const safe = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replace(/\r?\n/g, ' ');
const quote = text => String(text).split(/\r?\n/).map(line => '> ' + safe(line)).join('\n');
function markdown() {
  const lines = [
    '# Grid Atlas — 165 circuit stories: claim-level review queue',
    '',
    '**Research only. No independent historical approval. No publication permission.**',
    '',
    'Review the highest-risk items first. Risk flags are prompts, not verdicts. This worksheet does not record approvals.',
    '',
    '- 33 circuits / 165 bilingual drafts',
    '- ' + summary.single_source_dossiers + ' dossiers cite one source URL for all five stories',
    '- ' + summary.classification_only_stories + ' stories cite only result/classification sources',
    '- ' + summary.bilingual_numeral_review_candidates + ' stories require numeric EN/UK comparison',
    '- ' + summary.race_year_review_candidates + ' stories require race-year scope review',
    '',
  ];
  for (const item of entries) {
    lines.push('## ' + safe(item.circuit_id) + ' · ' + item.story_index + '/5 · ' + item.year,
      '', '**EN:** ' + safe(item.title.en), '', quote(item.narrative.en),
      '', '**UK:** ' + safe(item.title.uk), '', quote(item.narrative.uk),
      '', '**Risk:** ' + item.risk_score + ' · ' + (item.flags.join(', ') || 'no automatic flags'),
      '', '**Exact draft SHA-256:** `' + item.draft_fingerprint_sha256 + '`',
      '', '**Sources to inspect:**');
    for (const url of item.source_urls) lines.push('- ' + url);
    lines.push('', '**Human review checklist (all pending):**');
    for (const check of item.checks) lines.push('- [ ] ' + check.prompt);
    lines.push('', '**Sentence candidates for claim extraction (not validated claims):**');
    item.sentence_candidates.en.forEach((sentence, i) => lines.push('- EN ' + (i + 1) + ': ' + safe(sentence)));
    item.sentence_candidates.uk.forEach((sentence, i) => lines.push('- UK ' + (i + 1) + ': ' + safe(sentence)));
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

const format = process.argv[2] ?? '--format=json';
if (process.argv.length > 3 || !['--format=json', '--format=markdown'].includes(format)) {
  process.stderr.write('Usage: node scripts/circuit-claim-review-queue.mjs [--format=json|--format=markdown]\n');
  process.exitCode = 1;
} else {
  process.stdout.write(format === '--format=json' ? JSON.stringify(queue, null, 2) + '\n' : markdown() + '\n');
}
