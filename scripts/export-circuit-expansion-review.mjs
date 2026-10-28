#!/usr/bin/env node
/**
 * Offline-only editorial review packet for the 165 unpublished circuit research stories.
 * No Next.js import, approval mutation, public assets or deployment side effect.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const directory = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const files = [
  'EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const load = name => JSON.parse(readFileSync(new URL(name, directory), 'utf8'));
const coverage = load('F1DB_78_CONTENT_COVERAGE_20261027.json');
const triage = load('F1DB_33_EXPANSION_SOURCE_TRIAGE_20261028.json');
const expectedIds = coverage.circuits.filter(entry => !entry.five_story_research_batch).map(entry => entry.circuit_id).sort();
const triageById = new Map(triage.circuits.map(entry => [entry.circuit_id, entry]));
const uniqueIds = new Set();
const circuits = [];
let sourceReferences = 0;
const allSources = new Set();

function sourceType(raw) {
  const url = new URL(raw);
  if (url.hostname === 'www.formula1.com' && /^\/en\/results\/\d{4}\/races\/\d+\//.test(url.pathname)) return 'race_classification';
  if (url.hostname === 'www.formula1.com' && /^\/en\/results\//.test(url.pathname)) return 'results_index_or_award';
  if (url.hostname === 'www.formula1.com' && /^\/en\/latest\/article\//.test(url.pathname)) return 'historical_article';
  return 'other_source';
}

for (const file of files) {
  const batch = load(file);
  assert.equal(batch.publication, 'blocked', file + ': batch gate');
  for (const circuit of batch.circuits) {
    const id = circuit.circuit_id;
    assert.ok(!uniqueIds.has(id), id + ': duplicate dossier');
    uniqueIds.add(id);
    assert.equal(circuit.stories.length, 5, id + ': expected five stories');
    const triageEntry = triageById.get(id);
    assert.ok(triageEntry, id + ': missing triage');
    const seenIndexes = new Set();
    const sourcesForCircuit = new Set();
    const stories = circuit.stories.map(story => {
      assert.ok(Number.isInteger(story.story_index) && story.story_index >= 1 && story.story_index <= 5, id + ': invalid index');
      assert.ok(!seenIndexes.has(story.story_index), id + ': repeated index');
      seenIndexes.add(story.story_index);
      assert.ok(Number.isInteger(story.year) && story.year >= 1950 && story.year <= 2026, id + ': invalid year');
      assert.equal(story.independent_approval, false, id + ': human approval not present');
      assert.equal(story.publication, 'blocked', id + ': publication must remain blocked');
      assert.equal(story.research_status, 'source_linked_editorial_draft');
      for (const locale of ['en', 'uk']) {
        assert.ok(typeof story.title[locale] === 'string' && story.title[locale].trim().length > 8, id + ': missing title ' + locale);
        assert.ok(typeof story.narrative[locale] === 'string' && story.narrative[locale].trim().length > 80, id + ': missing narrative ' + locale);
      }
      assert.ok(Array.isArray(story.source_urls) && story.source_urls.length > 0, id + ': no source');
      const sources = story.source_urls.map(raw => {
        const url = new URL(raw);
        assert.equal(url.protocol, 'https:', id + ': insecure source');
        assert.equal(url.username, '', id + ': source URL credentials');
        assert.equal(url.password, '', id + ': source URL credentials');
        sourceReferences += 1;
        allSources.add(raw);
        sourcesForCircuit.add(raw);
        return { url: raw, kind: sourceType(raw) };
      });
      const resultYears = sources.map(source => source.url.match(/\/en\/results\/(\d{4})\/races\/\d+\//)?.[1]).filter(Boolean).map(Number);
      const warnings = [];
      if (sources.every(source => ['race_classification', 'results_index_or_award'].includes(source.kind))) {
        warnings.push('Classification/results pages do not substantiate every narrative or contextual claim.');
      }
      if (resultYears.length && !resultYears.includes(story.year)) {
        warnings.push('No race-classification URL matches the story year; verify the event and source scope.');
      }
      if (sources.some(source => source.kind === 'other_source')) {
        warnings.push('Check the origin, independence and claim-level relevance of non-F1 sources.');
      }
      const fingerprint = createHash('sha256').update(JSON.stringify({
        circuit_id: id, story_index: story.story_index, year: story.year,
        title: story.title, narrative: story.narrative, source_urls: story.source_urls,
      })).digest('hex');
      return {
        story_index: story.story_index,
        year: story.year,
        title: story.title,
        narrative: story.narrative,
        sources,
        fingerprint_sha256: fingerprint,
        editorial_status: 'unreviewed',
        independent_approval: false,
        publication_allowed: false,
        review_warnings: warnings,
      };
    }).sort((a, b) => a.story_index - b.story_index);
    assert.equal(sourcesForCircuit.size, triageEntry.unique_source_urls, id + ': triage count drift');
    assert.deepEqual([...sourcesForCircuit].sort(), [...triageEntry.source_urls].sort(), id + ': triage URLs drift');
    const singleSource = sourcesForCircuit.size === 1;
    if (singleSource) for (const story of stories) {
      story.review_warnings.unshift('All five stories in this dossier cite the same URL; seek claim-level corroboration.');
    }
    circuits.push({
      circuit_id: id,
      research_file: file,
      source_diversity: singleSource ? 'single_source_dossier' : 'multiple_sources_not_independent_verification',
      unique_source_urls: sourcesForCircuit.size,
      editorial_status: 'unreviewed',
      independent_approval: false,
      publication_allowed: false,
      stories,
    });
  }
}
circuits.sort((a, b) => a.circuit_id.localeCompare(b.circuit_id));
assert.deepEqual(circuits.map(circuit => circuit.circuit_id), expectedIds, 'expansion cohort drift');
assert.equal(circuits.length, 33);
assert.equal(circuits.reduce((count, circuit) => count + circuit.stories.length, 0), 165);
assert.equal(sourceReferences, triage.summary.total_story_source_references, 'reference count drift');
assert.equal(allSources.size, triage.summary.distinct_source_urls, 'source URL count drift');
assert.equal(circuits.filter(circuit => circuit.unique_source_urls === 1).length, triage.summary.single_source_circuits, 'source risk drift');

const packet = {
  schema_version: 1,
  kind: 'offline_editorial_review_only',
  publication_allowed: false,
  independent_approval: false,
  f1db_release: 'v2026.17.0',
  summary: {
    circuits: circuits.length,
    stories: 165,
    source_references: sourceReferences,
    distinct_source_urls: allSources.size,
    single_source_circuits: circuits.filter(circuit => circuit.unique_source_urls === 1).length,
    published: 0,
  },
  circuits,
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function toHtml() {
  const circuitMarkup = circuits.map(circuit => {
    const storyMarkup = circuit.stories.map(story => {
      const sources = story.sources.map(source =>
        '<li><a href="' + escapeHtml(source.url) + '" rel="noopener noreferrer" target="_blank">' +
        escapeHtml(source.kind.replaceAll('_', ' ')) + ' ↗</a></li>').join('');
      const warnings = story.review_warnings.map(warning => '<li>' + escapeHtml(warning) + '</li>').join('');
      return '<article class="story"><div class="story-head"><span class="year">' + story.year +
        '</span><span>Draft ' + story.story_index + '/5 · not approved</span></div>' +
        '<div class="languages"><section lang="en"><h3>' + escapeHtml(story.title.en) + '</h3><p>' +
        escapeHtml(story.narrative.en) + '</p></section><section lang="uk"><h3>' +
        escapeHtml(story.title.uk) + '</h3><p>' + escapeHtml(story.narrative.uk) +
        '</p></section></div><div class="evidence"><div><h4>Sources (not claim-level clearance)</h4><ul>' +
        sources + '</ul></div><div><h4>Review warnings</h4><ul>' + warnings +
        '</ul></div></div><p class="fingerprint">SHA-256 draft fingerprint: <code>' +
        story.fingerprint_sha256 + '</code></p></article>';
    }).join('');
    return '<details class="circuit"><summary><strong>' + escapeHtml(circuit.circuit_id) +
      '</strong><span>5 bilingual stories · ' + circuit.unique_source_urls +
      ' distinct source URL(s) · unpublished</span></summary>' + storyMarkup + '</details>';
  }).join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow"><title>Grid Atlas · Offline circuit story review</title>' +
    '<style>:root{font-family:system-ui,sans-serif;color-scheme:light dark}body{max-width:1200px;margin:auto;padding:clamp(1rem,3vw,3rem);line-height:1.6}' +
    'h1{line-height:1.2}.notice{border:2px solid currentColor;padding:1rem 1.5rem}.circuit{border-bottom:1px solid #888;padding:1rem 0}' +
    'summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;align-items:center;min-height:48px}' +
    '.story{border-top:1px solid #888;padding:1.5rem 0}.story-head{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}' +
    '.year{font-size:1.4rem;font-weight:700}.languages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem}' +
    '.languages section{min-width:0}.evidence{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem}' +
    'a,code{overflow-wrap:anywhere}.fingerprint{font-size:.75rem;opacity:.85}a:focus-visible,summary:focus-visible{outline:3px solid currentColor;outline-offset:3px}' +
    '@media(max-width:700px){.languages,.evidence{grid-template-columns:1fr}}@media print{details{break-inside:avoid}.circuit>summary{font-weight:bold}}</style></head><body>' +
    '<header><h1>Grid Atlas · Offline editorial reading desk</h1><p class="notice"><strong>165 AI-assisted research drafts · 33 circuits.</strong> ' +
    'Not independently verified. Not approved for publication. This file is generated locally, outside the public web application; it is not a release artifact.</p>' +
    '<p>Compare English and Ukrainian side by side. Inspect each source and warning. Fingerprints identify exact drafts; they do not constitute review signatures.</p>' +
    '<p><strong>Source concentration:</strong> ' + packet.summary.single_source_circuits +
    '/33 dossiers rely on a single URL. Source references: ' + packet.summary.source_references +
    '; distinct URLs: ' + packet.summary.distinct_source_urls + '.</p></header><main>' +
    circuitMarkup + '</main><footer><p>Human approval and publication gates remain unchanged.</p></footer></body></html>';
}

const format = process.argv[2] ?? '--format=json';
if (process.argv.length > 3 || !['--format=json', '--format=html'].includes(format)) {
  process.stderr.write('Usage: node scripts/export-circuit-expansion-review.mjs [--format=json|--format=html]\n');
  process.exitCode = 1;
} else {
  process.stdout.write(format === '--format=html' ? toHtml() : JSON.stringify(packet, null, 2) + '\n');
}
