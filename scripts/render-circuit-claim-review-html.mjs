#!/usr/bin/env node
/**
 * Local-only, no-JavaScript editorial desk for reviewing 165 claim worksheets.
 * Source is the existing fail-closed claim queue; this does not approve content.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const raw = execFileSync(process.execPath, [
  'scripts/circuit-claim-review-queue.mjs', '--format=json',
], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const queue = JSON.parse(raw);
assert.equal(queue.kind, 'offline_claim_review_queue');
assert.equal(queue.publication_allowed, false);
assert.equal(queue.independent_approval, false);
assert.equal(queue.summary.circuits, 33);
assert.equal(queue.summary.stories, 165);
assert.equal(queue.summary.publication_ready, 0);
assert.equal(queue.summary.independently_verified, 0);

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const safeId = value => {
  assert.match(value, /^[a-z0-9-]+$/);
  return value;
};
const safeSource = value => {
  const parsed = new URL(value);
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.username, '');
  assert.equal(parsed.password, '');
  return escapeHtml(value);
};
const list = (items, className = '') =>
  '<ul' + (className ? ' class="' + className + '"' : '') + '>' +
  items.map(item => '<li>' + item + '</li>').join('') + '</ul>';
const byCircuit = new Map();
for (const item of queue.entries) {
  assert.equal(item.publication_allowed, false);
  assert.equal(item.independently_verified, false);
  assert.equal(item.reviewer_decision, 'not_recorded');
  assert.match(item.draft_fingerprint_sha256, /^[a-f0-9]{64}$/);
  if (!byCircuit.has(item.circuit_id)) byCircuit.set(item.circuit_id, []);
  byCircuit.get(item.circuit_id).push(item);
}
assert.equal(byCircuit.size, 33);
const groups = [...byCircuit.entries()];
const total = groups.reduce((sum, [, stories]) => sum + stories.length, 0);
assert.equal(total, 165);
assert.ok(groups.every(([, stories]) => stories.length === 5));

function renderStory(item) {
  const id = 'story-' + safeId(item.circuit_id) + '-' + item.story_index;
  const flags = item.flags.length
    ? list(item.flags.map(flag => escapeHtml(flag.replaceAll('_', ' '))), 'flags')
    : '<p>No automatic risk flags; manual review is still required.</p>';
  const sources = list(item.source_urls.map((url, index) =>
    '<a href="' + safeSource(url) +
    '" target="_blank" rel="noopener noreferrer">' +
    escapeHtml(item.source_kinds[index].replaceAll('_', ' ')) +
    ' · source ' + (index + 1) + ' ↗</a>'));
  const checks = '<ol class="checks">' + item.checks.map(check => {
    assert.equal(check.status, 'pending');
    assert.equal(check.evidence_locator, null);
    return '<li><strong>Pending: ' + escapeHtml(check.key.replaceAll('_', ' ')) +
      '.</strong> ' + escapeHtml(check.prompt) + '</li>';
  }).join('') + '</ol>';
  const mismatch = [...item.numerical_comparison.only_en, ...item.numerical_comparison.only_uk].length
    ? '<p class="warning">EN-only numerals: ' +
      escapeHtml(item.numerical_comparison.only_en.join(', ') || 'none') +
      '; UK-only numerals: ' +
      escapeHtml(item.numerical_comparison.only_uk.join(', ') || 'none') +
      '. Compare the complete translations manually.</p>'
    : '<p>Automatic numeral comparison found no differences; this does not verify translation.</p>';
  const sentences = ['en', 'uk'].map(locale =>
    '<section lang="' + locale + '"><h5>' + locale.toUpperCase() + '</h5><ol>' +
    item.sentence_candidates[locale].map(sentence =>
      '<li>' + escapeHtml(sentence) + '</li>').join('') + '</ol></section>').join('');
  return '<article class="story" id="' + id + '" aria-labelledby="' + id + '-title">' +
    '<div class="story-meta"><span>Research draft ' + item.story_index + '/5 · ' +
    item.year + '</span><strong>Review priority ' + item.risk_score +
    ' (heuristic only)</strong></div>' +
    '<h3 id="' + id + '-title">' + escapeHtml(item.title.en) + '</h3>' +
    '<div class="languages"><section lang="en"><h4>English</h4><p>' +
    escapeHtml(item.narrative.en) + '</p></section>' +
    '<section lang="uk"><h4>' + escapeHtml(item.title.uk) +
    '</h4><p>' + escapeHtml(item.narrative.uk) + '</p></section></div>' +
    '<div class="review-grid"><section><h4>Evidence and automatic warnings</h4>' +
    sources + flags + mismatch + '</section><section><h4>Human review required</h4>' +
    checks + '</section></div>' +
    '<details><summary>Sentence candidates (not independently verified claims)</summary>' +
    '<div class="languages">' + sentences + '</div></details>' +
    '<p class="fingerprint">Exact research draft SHA-256: <code>' +
    item.draft_fingerprint_sha256 + '</code>. Not an approval signature.</p>' +
    '<p class="back"><a href="#circuit-index">Back to circuit index ↑</a></p></article>';
}

const index = groups.map(([id, stories]) =>
  '<li><a href="#circuit-' + safeId(id) + '">' + escapeHtml(id) +
  '</a> <small>(' + Math.max(...stories.map(item => item.risk_score)) +
  ' priority; ' + stories[0].dossier_unique_source_urls +
  ' source URL(s))</small></li>').join('');
const sections = groups.map(([id, stories]) =>
  '<section class="circuit" id="circuit-' + safeId(id) +
  '" aria-labelledby="heading-' + safeId(id) + '">' +
  '<h2 id="heading-' + safeId(id) + '">' + escapeHtml(id) +
  ' · five bilingual research drafts</h2>' +
  '<p>Distinct source URLs in dossier: ' + stories[0].dossier_unique_source_urls +
  '. Sorted by automatic risk, not by historical significance. ' +
  '<strong>Zero stories approved for publication.</strong></p>' +
  stories.map(renderStory).join('') + '</section>').join('');
const css = [
  ':root{font-family:system-ui,sans-serif;color-scheme:light dark;line-height:1.55}',
  'body{max-width:1250px;margin:auto;padding:clamp(1rem,3vw,3rem)}',
  'h1,h2,h3,h4,h5{line-height:1.25}h2{margin-top:3rem}',
  '.notice{border:2px solid currentColor;padding:1rem 1.25rem}',
  '.index{columns:3;column-gap:2rem}.index li{break-inside:avoid;padding:.2rem}',
  '.circuit{border-top:3px solid currentColor;scroll-margin-top:1rem}',
  '.story{border-top:1px solid #888;padding:1.75rem 0;scroll-margin-top:1rem}',
  '.story-meta{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}',
  '.languages,.review-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem}',
  '.languages>section,.review-grid>section{min-width:0}',
  '.checks li{margin-bottom:.6rem}.flags{font-weight:600}.warning{border-left:3px solid currentColor;padding-left:1rem}',
  '.fingerprint{font-size:.8rem;overflow-wrap:anywhere}.back{text-align:right}',
  'a,code{overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid currentColor;outline-offset:3px}',
  'summary{cursor:pointer;min-height:44px;padding:.5rem 0}',
  '@media(max-width:720px){.languages,.review-grid{grid-template-columns:1fr}.index{columns:2}}',
  '@media(max-width:420px){.index{columns:1}}',
  '@media print{body{max-width:none}.index,.back,details{display:none}.story{break-inside:avoid}.circuit{break-before:page}}',
].join('');
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<meta name="robots" content="noindex,nofollow">' +
  '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; object-src &#39;none&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">' +
  '<title>Grid Atlas · Offline circuit claim review</title><style>' + css +
  '</style></head><body><header><h1>Grid Atlas · Claim-level editorial desk</h1>' +
  '<p class="notice"><strong>165 bilingual AI-assisted research drafts across 33 circuits.</strong> ' +
  'Not independently verified. Not approved for publication. This is a local-only worksheet, not a public release.</p>' +
  '<p>Priority is a deterministic source-risk heuristic, not a truth score. ' +
  'Each story requires separate historical, translation and editorial review. ' +
  'Links open original source pages; no images, scripts, trackers or remote resources are embedded.</p>' +
  '<p><strong>Review queue:</strong> ' + queue.summary.single_source_dossiers +
  ' single-source dossiers; ' + queue.summary.classification_only_stories +
  ' classification-only stories; ' + queue.summary.bilingual_numeral_review_candidates +
  ' numerical translation review candidates. Approved: 0.</p></header>' +
  '<nav aria-label="Circuit review index" id="circuit-index"><h2>Jump to circuit</h2><ol class="index">' +
  index + '</ol></nav><main>' + sections +
  '</main><footer><p>Human approval, public release and media licensing gates remain unchanged.</p></footer>' +
  '</body></html>';
process.stdout.write(html + '\n');
