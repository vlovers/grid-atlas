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

/**
 * robots.txt per RFC 9309: user-agent lines form a group until the first rule line; the most
 * specific group (ours, else "*") applies; the longest matching Allow/Disallow wins (Allow on ties).
 * 4xx → no restrictions; 5xx or unreachable → full disallow. Crawl-delay is honoured.
 */
const robots = new Map();
async function robotsFor(origin) {
  if (robots.has(origin)) return robots.get(origin);
  let policy = { rules: [], delay: 0, disallowAll: false };
  try {
    const r = await fetch(`${origin}/robots.txt`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
    if (r.status >= 500) policy.disallowAll = true;
    else if (r.ok) policy = parseRobots(await r.text());
  } catch { policy.disallowAll = true; }
  robots.set(origin, policy);
  return policy;
}

export function parseRobots(text) {
  const groups = [];
  let current = null, inAgents = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const sep = line.indexOf(':');
    if (sep < 0) continue;
    const key = line.slice(0, sep).trim().toLowerCase(), value = line.slice(sep + 1).trim();
    if (key === 'user-agent') {
      if (!inAgents) { current = { agents: [], rules: [], delay: 0 }; groups.push(current); inAgents = true; }
      current.agents.push(value.toLowerCase());
    } else if (current) {
      inAgents = false;
      if ((key === 'allow' || key === 'disallow') && value) current.rules.push({ allow: key === 'allow', path: value });
      if (key === 'crawl-delay' && Number(value) > 0) current.delay = Number(value);
    }
  }
  const ours = groups.filter(g => g.agents.some(a => a.includes('gridatlas')));
  const chosen = ours.length ? ours : groups.filter(g => g.agents.includes('*'));
  return { rules: chosen.flatMap(g => g.rules), delay: Math.max(0, ...chosen.map(g => g.delay)), disallowAll: false };
}

export function robotsAllows(policy, target) {
  if (policy.disallowAll) return false;
  const matches = policy.rules.filter(rule => robotsRule(rule.path).test(target));
  if (!matches.length) return true;
  const longest = Math.max(...matches.map(m => m.path.length));
  return matches.filter(m => m.path.length === longest).some(m => m.allow);
}

async function allowed(url) {
  const { origin, pathname, search } = new URL(url);
  return robotsAllows(await robotsFor(origin), pathname + search);
}

/** robots.txt path rule → anchored RegExp: "*" matches any run, a trailing "$" anchors the end. */
function robotsRule(rule) {
  const anchored = rule.endsWith('$');
  const body = (anchored ? rule.slice(0, -1) : rule).split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

const lastHit = new Map();
async function politeFetch(url) {
  const { host, origin } = new URL(url);
  const crawlDelay = (robots.get(origin)?.delay ?? 0) * 1000;
  const wait = (lastHit.get(host) ?? 0) + Math.max(delayMs, crawlDelay) - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastHit.set(host, Date.now());
  return fetch(url, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5' }, signal: AbortSignal.timeout(30000) });
}

/** Follow up to 5 redirects manually, applying robots.txt (and spacing) to every hop's origin. */
async function fetchWithRobots(url) {
  let current = url;
  for (let hop = 0; hop <= 5; hop++) {
    if (!(await allowed(current))) return { robotsBlocked: true, url: current };
    const response = await politeFetch(current);
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) { current = new URL(location, current).toString(); continue; }
    return { response, url: current };
  }
  throw new Error('too_many_redirects');
}

async function check(record) {
  const row = { url: record.url, source_id: record.source_id, checked_at: new Date().toISOString() };
  try {
    const result = await fetchWithRobots(record.url);
    if (result.robotsBlocked) return { ...row, outcome: 'robots_disallowed', final_url: result.url };
    const response = result.response;
    const type = response.headers.get('content-type') ?? '';
    Object.assign(row, { http_status: response.status, final_url: result.url, content_type: type.split(';')[0] });
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
