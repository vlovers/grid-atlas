#!/usr/bin/env node
/**
 * Polite, read-only liveness check and snapshot capture for every source URL already cited by
 * circuit content. Deterministic fetcher (no LLM): it records HTTP status, final URL, content
 * type and the SHA-256 of the extracted text.
 *
 * Copyright: snapshot text is stored ONLY under .grid-atlas/source-snapshots/ (git-ignored).
 * The committed status file holds metadata and hashes, never article text.
 *
 * Usage: node scripts/source-fetch.mjs [--limit=N] [--only=<circuit,...>]
 * Output: docs/editorial/circuit-evidence/source-status.json (merged; existing rows kept)
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadCorpus } from '../packages/editorial-evidence/src/ingest.ts';
import { buildRegistry, htmlToText } from '../packages/editorial-evidence/src/sources.ts';
import { sha256 } from '../packages/editorial-policy/src/index.ts';

const root = resolve(import.meta.dirname, '..');
const SNAPSHOTS = join(root, '.grid-atlas/source-snapshots');
const STATUS = join(root, 'docs/editorial/circuit-evidence/source-status.json');
const UA = 'GridAtlasSourceCheck/0.1 (+https://github.com/vlovers/grid-atlas; read-only citation check)';
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const limit = Number(arg('limit') ?? Infinity);
const only = arg('only')?.split(',');
const hosts = arg('hosts')?.split(',');          // e.g. --hosts=www.grandprix.com
const retry = arg('retry')?.split(',');          // e.g. --retry=rate_limited,unreachable
const delayMs = Number(arg('delay') ?? 1500);    // per-host spacing

const archive = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json'), 'utf8'));
let registry = buildRegistry(loadCorpus(root).blocks, archive.source.release);
if (only) registry = registry.filter(r => r.circuits.some(c => only.includes(c)));
if (hosts) registry = registry.filter(r => hosts.includes(r.host) || hosts.includes(`www.${r.host}`));
mkdirSync(SNAPSHOTS, { recursive: true });
mkdirSync(join(root, 'docs/editorial/circuit-evidence'), { recursive: true });
const status = existsSync(STATUS) ? JSON.parse(readFileSync(STATUS, 'utf8')) : {};
if (retry) registry = registry.filter(r => retry.includes(status[r.source_id]?.outcome));
registry = registry.slice(0, limit);

const robots = new Map();
async function allowed(url) {
  const { origin, pathname } = new URL(url);
  if (!robots.has(origin)) {
    let rules = [];
    try {
      const r = await fetch(`${origin}/robots.txt`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if (r.ok) {
        let applies = false;
        for (const line of (await r.text()).split('\n')) {
          const [k, ...v] = line.split(':'); const key = k.trim().toLowerCase(); const value = v.join(':').trim();
          if (key === 'user-agent') applies = value === '*' || /gridatlas/i.test(value);
          else if (applies && key === 'disallow' && value) rules.push(value);
        }
      }
    } catch { /* unreachable robots.txt: proceed, as crawlers conventionally do */ }
    robots.set(origin, rules);
  }
  const target = pathname + new URL(url).search;
  return !robots.get(origin).some(rule => robotsRule(rule).test(target));
}

/** robots.txt path rule → anchored RegExp: "*" matches any run, a trailing "$" anchors the end. */
function robotsRule(rule) {
  const anchored = rule.endsWith('$');
  const body = (anchored ? rule.slice(0, -1) : rule).split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

const lastHit = new Map();
async function politeFetch(url) {
  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + delayMs - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastHit.set(host, Date.now());
  return fetch(url, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5' }, signal: AbortSignal.timeout(30000) });
}

async function check(record) {
  const row = { url: record.url, source_id: record.source_id, checked_at: new Date().toISOString() };
  try {
    if (!(await allowed(record.url))) return { ...row, outcome: 'robots_disallowed' };
    const response = await politeFetch(record.url);
    const type = response.headers.get('content-type') ?? '';
    Object.assign(row, { http_status: response.status, final_url: response.url, content_type: type.split(';')[0] });
    // 401/403 (and vendor codes like 475) mean the publisher refuses automated access — not a dead link.
    if (!response.ok) return { ...row, outcome: response.status === 404 || response.status === 410 ? 'gone'
      : response.status === 429 ? 'rate_limited' : [401, 403, 451, 475].includes(response.status) ? 'access_denied' : 'http_error' };
    if (/pdf/.test(type)) {
      const bytes = Buffer.from(await response.arrayBuffer());
      return { ...row, outcome: 'live_pdf_no_text', bytes_sha256: sha256(bytes.toString('latin1')), bytes: bytes.length };
    }
    const html = await response.text();
    const text = htmlToText(html);
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const hash = sha256(text);
    writeFileSync(join(SNAPSHOTS, `${hash}.txt`), text);
    const thin = text.length < 1500;
    return { ...row, outcome: thin ? 'live_thin_or_scripted' : 'live', title, text_sha256: hash, text_chars: text.length };
  } catch (error) {
    return { ...row, outcome: 'unreachable', error: String(error?.cause?.code ?? error?.name ?? error).slice(0, 80) };
  }
}

// Different hosts in parallel, one request at a time per host.
const byHost = new Map();
for (const r of registry) { const h = (() => { try { return new URL(r.url).host; } catch { return 'invalid'; } })(); byHost.set(h, [...(byHost.get(h) ?? []), r]); }
let done = 0;
await Promise.all([...byHost.values()].map(async queue => {
  for (const record of queue) {
    status[record.source_id] = record.issues.includes('invalid_url') ? { url: record.url, source_id: record.source_id, outcome: 'invalid_url' } : await check(record);
    if (++done % 25 === 0) { writeFileSync(STATUS, `${JSON.stringify(status, null, 1)}\n`); console.log(`${done}/${registry.length}`); }
  }
}));
const sorted = Object.fromEntries(Object.entries(status).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(STATUS, `${JSON.stringify(sorted, null, 1)}\n`);
const tally = {};
for (const row of Object.values(sorted)) tally[row.outcome] = (tally[row.outcome] ?? 0) + 1;
console.log(JSON.stringify({ checked: registry.length, tally }));
