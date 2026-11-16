/**
 * Registry of every source URL already cited by circuit content, with structural checks that
 * need no network. Liveness and snapshots come from scripts/source-fetch.mjs.
 */
import { sha256 } from '../../editorial-policy/src/index.ts';
import type { ContentSource } from './claims.ts';

export type SourceClass = 'f1db_dataset' | 'fia_official' | 'f1_official' | 'circuit_operator' | 'publication' | 'reference_tertiary' | 'media_repository' | 'other';
export type SourceRecord = {
  source_id: string; url: string; normalized: string; host: string; class: SourceClass;
  cited_by: string[]; circuits: string[]; issues: string[];
};

const CLASSES: [RegExp, SourceClass][] = [
  [/(^|\.)github\.com$|(^|\.)f1db\./, 'f1db_dataset'],
  [/(^|\.)fia\.com$/, 'fia_official'],
  [/(^|\.)formula1\.com$/, 'f1_official'],
  [/wikipedia\.org$|wikidata\.org$/, 'reference_tertiary'],
  [/commons\.wikimedia\.org$|flickr\.com$/, 'media_repository'],
  [/motorsportmagazine\.com$|grandprix\.com$|autosport\.com$|motorsport\.com$|bbc\.co\.uk$|theguardian\.com$|racefans\.net$|nytimes\.com$|espn\./, 'publication'],
  [/silverstone\.co\.uk$|monza\.net$|spa-francorchamps\.be$|suzukacircuit\.jp$|circuitcat\.com$|hungaroring\.hu$|redbullring\.com$|circuitzandvoort\.nl$|cotaland\.com$|circuitoftheamericas\.com$|bahraingp\.com$|yasmarinacircuit\.com$|lcqfia\.com$|interlagos/, 'circuit_operator'],
];

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/.test(key)) u.searchParams.delete(key);
    u.hostname = u.hostname.replace(/^www\./, '');
    return u.toString().replace(/\/$/, '');
  } catch { return url.trim(); }
}

export const sourceId = (url: string) => `src-${sha256(normalizeUrl(url)).slice(0, 12)}`;

/** Build the registry and flag structural problems that no fetch can fix. */
export function buildRegistry(blocks: readonly ContentSource[], pinnedRelease: string): SourceRecord[] {
  const byId = new Map<string, SourceRecord>();
  for (const block of blocks) for (const url of block.cited_urls) {
    const id = sourceId(url);
    let record = byId.get(id);
    if (!record) {
      let host = '';
      try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* reported below */ }
      record = { source_id: id, url, normalized: normalizeUrl(url), host, class: CLASSES.find(([re]) => re.test(host))?.[1] ?? 'other', cited_by: [], circuits: [], issues: [] };
      if (!/^https:\/\//.test(url)) record.issues.push('not_https');
      if (!host) record.issues.push('invalid_url');
      if (record.class === 'f1db_dataset' && /f1db/.test(url) && !url.includes(`/${pinnedRelease}/`)) record.issues.push('dataset_url_not_pinned');
      if (record.class === 'reference_tertiary') record.issues.push('tertiary_source');
      byId.set(id, record);
    }
    if (!record.cited_by.includes(block.block_id)) record.cited_by.push(block.block_id);
    if (!record.circuits.includes(block.circuit_id)) record.circuits.push(block.circuit_id);
    // An official results page for one season cited by text about other years.
    const year = url.match(/formula1\.com\/en\/results\/(\d{4})\//)?.[1];
    if (year && !`${block.en} ${block.year_label ?? ''}`.includes(year) && !record.issues.includes(`results_year_not_in_text:${block.block_id}`))
      record.issues.push(`results_year_not_in_text:${block.block_id}`);
  }
  return [...byId.values()].sort((a, b) => a.source_id.localeCompare(b.source_id));
}

/** Plain text from HTML: drop scripts/styles/nav chrome, decode common entities, collapse space. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t\f\v\r]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}
