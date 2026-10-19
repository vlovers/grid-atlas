import { createHash } from 'node:crypto';

export type MediaSubject = { type: 'driver' | 'constructor' | 'circuit' | 'race'; id: string };
export type LayoutMapping = { id: string; circuit_id: string; race_ids: string[] };
export type MediaAsset = {
  id: string;
  subject: MediaSubject;
  kind: 'photograph' | 'portrait' | 'circuit-diagram' | 'car-illustration';
  source_url: string | null;
  file_page_url: string;
  creator: string | null;
  attribution: string | null;
  license: { identifier: string | null; url: string | null; restrictions: string[] };
  image: { mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/svg+xml'; width: number | null; height: number | null };
  status: 'candidate' | 'verified' | 'rejected' | 'withdrawn';
  review: { actor: 'human'; reviewer: string; reviewed_on: string; note: string; payload_sha256: string } | null;
  delivery: { local_path: string | null; remote_url: string | null };
  source_revision: string;
  inspected_on: string;
  content_sha256: string | null;
  modifications: string | null;
  rights_note: string | null;
  alt: { uk: string | null; en: string | null };
  caption: { uk: string | null; en: string | null };
  layout: { id: string; race_ids: string[]; source_url: string; source_revision: string } | null;
};
export type MediaRegistry = { schema_version: 1; lane: 'candidates' | 'publication'; assets: MediaAsset[] };
const fields = 'id subject kind source_url file_page_url creator attribution license image status review delivery source_revision inspected_on content_sha256 modifications rights_note alt caption layout';
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const key = (s: MediaSubject) => `${s.type}:${s.id}`;
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`Media registry: ${message}`); }
function shape(v: unknown, expected: string, path: string): asserts v is Record<string, unknown> {
  check(v && typeof v === 'object' && !Array.isArray(v) &&
    Object.keys(v).sort().join(' ') === expected.split(' ').sort().join(' '), `${path}: expected fields ${expected}`);
}
function date(v: unknown, path: string): asserts v is string {
  check(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, `${path}: expected YYYY-MM-DD`);
}
function https(v: unknown, path: string): asserts v is string {
  try {
    check(text(v) && !/\s/.test(v), path);
    const u = new URL(v);
    check(u.protocol === 'https:' && u.hostname && !u.username && !u.password && u.pathname !== '/', path);
  } catch { throw new Error(`Media registry: ${path}: expected an exact HTTPS document URL`); }
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, canonical(v)]));
  return value;
}
/** Changes to identity, text, rights, bytes, delivery or layout invalidate review. */
export function mediaFingerprint(asset: MediaAsset): string {
  const payload: Record<string, unknown> = { ...asset };
  delete payload.status;
  delete payload.review;
  return createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');
}

export function publicationProblems(asset: MediaAsset, asOf: string, remoteOrigins: readonly string[] = []): string[] {
  const errors: string[] = [];
  for (const field of ['source_url', 'creator', 'attribution', 'modifications', 'rights_note'] as const)
    if (!text(asset[field])) errors.push(`${field}: required for publication`);
  if (!text(asset.license.identifier) || !text(asset.license.url)) errors.push('license: identifier and URL required');
  if (!asset.image.width || !asset.image.height) errors.push('image: dimensions required');
  if (!asset.content_sha256 || !/^[a-f0-9]{64}$/.test(asset.content_sha256)) errors.push('content_sha256: ingested file checksum required');
  for (const locale of ['uk', 'en'] as const) if (!text(asset.alt[locale]) || !text(asset.caption[locale]))
    errors.push(`${locale}: independent alt text and caption required`);
  const { local_path: local, remote_url: remote } = asset.delivery;
  if (Boolean(local) === Boolean(remote)) errors.push('delivery: choose exactly one local path or approved remote URL');
  if (remote && !remoteOrigins.includes(new URL(remote).origin)) errors.push('delivery: remote origin not approved; hotlinking is disabled by default');
  if (!asset.review || asset.review.actor !== 'human' || !text(asset.review.reviewer) || !text(asset.review.note))
    errors.push('review: independent human rights/identity review required');
  else {
    if (asset.review.payload_sha256 !== mediaFingerprint(asset)) errors.push('review: stale payload; re-review changed metadata or bytes');
    if (asset.review.reviewed_on < asset.inspected_on || asset.review.reviewed_on > asOf) errors.push('review: invalid review chronology');
  }
  return errors;
}

/** Fixed asOf + explicit identity set make validation deterministic and offline. */
export function parseMediaRegistry(value: unknown, subjects: readonly MediaSubject[], asOf: string,
  lane: MediaRegistry['lane'], remoteOrigins: readonly string[] = [], layoutMappings: readonly LayoutMapping[] = []): MediaRegistry {
  date(asOf, 'asOf');
  shape(value, 'schema_version lane assets', 'registry');
  check(value.schema_version === 1 && value.lane === lane && Array.isArray(value.assets), 'wrong schema, lane or assets array');
  const known = new Set(subjects.map(key));
  const ids = new Set<string>();
  for (const [index, item] of value.assets.entries()) {
    const p = `assets[${index}]`;
    shape(item, fields, p);
    check(text(item.id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) && !ids.has(item.id), `${p}.id: invalid or duplicate ID`);
    ids.add(item.id);
    shape(item.subject, 'type id', `${p}.subject`);
    check(['driver', 'constructor', 'circuit', 'race'].includes(String(item.subject.type)) && text(item.subject.id) &&
      known.has(`${item.subject.type}:${item.subject.id}`), `${p}.subject: unknown canonical F1DB subject reference`);
    check(['photograph', 'portrait', 'circuit-diagram', 'car-illustration'].includes(String(item.kind)), `${p}.kind: unsupported`);
    check((lane === 'candidates' ? ['candidate', 'rejected', 'withdrawn'] : ['verified', 'rejected', 'withdrawn'])
      .includes(String(item.status)), `${p}.status: invalid for ${lane} lane`);
    https(item.file_page_url, `${p}.file_page_url`);
    if (item.source_url !== null) https(item.source_url, `${p}.source_url`);
    for (const field of ['creator', 'attribution', 'modifications', 'rights_note'] as const)
      check(item[field] === null || text(item[field]), `${p}.${field}: text or null required`);
    check(text(item.source_revision), `${p}.source_revision: required`);
    date(item.inspected_on, `${p}.inspected_on`);
    check(item.inspected_on <= asOf, `${p}.inspected_on: future inspection`);
    check(item.content_sha256 === null || (typeof item.content_sha256 === 'string' && /^[a-f0-9]{64}$/.test(item.content_sha256)), `${p}.content_sha256: invalid checksum`);
    shape(item.license, 'identifier url restrictions', `${p}.license`);
    check(item.license.identifier === null || text(item.license.identifier), `${p}.license.identifier: text or null required`);
    if (item.license.url !== null) https(item.license.url, `${p}.license.url`);
    check(Array.isArray(item.license.restrictions) && item.license.restrictions.every(text), `${p}.license.restrictions: expected text array`);
    shape(item.image, 'mime width height', `${p}.image`);
    check(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(String(item.image.mime)), `${p}.image.mime: unsupported`);
    for (const field of ['width', 'height']) check(item.image[field] === null ||
      (Number.isSafeInteger(item.image[field]) && Number(item.image[field]) > 0), `${p}.image.${field}: positive integer or null required`);
    shape(item.delivery, 'local_path remote_url', `${p}.delivery`);
    check(item.delivery.local_path === null || (typeof item.delivery.local_path === 'string' &&
      /^\/media\/[a-z0-9/-]+\.(jpg|jpeg|png|webp|svg)$/.test(item.delivery.local_path)), `${p}.delivery.local_path: expected a path under /media/`);
    if (typeof item.delivery.local_path === 'string') {
      const extensions: Record<string, string[]> = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/svg+xml': ['svg'] };
      check(extensions[String(item.image.mime)].includes(item.delivery.local_path.split('.').at(-1)!), `${p}.delivery: MIME and file extension mismatch`);
    }
    if (item.delivery.remote_url !== null) https(item.delivery.remote_url, `${p}.delivery.remote_url`);
    if (lane === 'candidates') check(item.delivery.local_path === null && item.delivery.remote_url === null && item.review === null,
      `${p}: candidates cannot carry delivery locations or human approvals`);
    for (const field of ['alt', 'caption']) {
      shape(item[field], 'uk en', `${p}.${field}`);
      for (const locale of ['uk', 'en']) check(item[field][locale] === null || text(item[field][locale]), `${p}.${field}.${locale}: text or null required`);
    }
    if (item.review !== null) {
      shape(item.review, 'actor reviewer reviewed_on note payload_sha256', `${p}.review`);
      check(item.review.actor === 'human' && text(item.review.reviewer) && text(item.review.note), `${p}.review: named human and rationale required`);
      date(item.review.reviewed_on, `${p}.review.reviewed_on`);
    }
    if (item.kind === 'circuit-diagram') {
      check(item.subject.type === 'circuit', `${p}.layout: diagram subject must be a circuit`);
      shape(item.layout, 'id race_ids source_url source_revision', `${p}.layout`);
      check(text(item.layout.id) && text(item.layout.source_revision), `${p}.layout: exact layout ID and source revision required`);
      https(item.layout.source_url, `${p}.layout.source_url`);
      check(Array.isArray(item.layout.race_ids) && item.layout.race_ids.length > 0 &&
        new Set(item.layout.race_ids).size === item.layout.race_ids.length &&
        item.layout.race_ids.every(id => typeof id === 'string' && known.has(`race:${id}`)), `${p}.layout.race_ids: unique canonical race references required`);
      const layout = item.layout;
      const subject = item.subject;
      const mapping = layoutMappings.find(m => m.id === layout.id && m.circuit_id === subject.id);
      check(mapping && (layout.race_ids as string[]).every(id => mapping.race_ids.includes(id)),
        `${p}.layout: pinned race/circuit/layout mapping mismatch`);
    } else check(item.layout === null, `${p}.layout: only circuit diagrams have layout metadata`);
    const asset = item as unknown as MediaAsset;
    if (asset.status === 'verified') {
      const errors = publicationProblems(asset, asOf, remoteOrigins);
      check(!errors.length, `${p}: ${errors.join('; ')}`);
    }
  }
  return value as unknown as MediaRegistry;
}

export function selectMedia(assets: readonly MediaAsset[], id: string | undefined, subject: MediaSubject,
  raceId?: string, remoteOrigins: readonly string[] = [], asOf = new Date().toISOString().slice(0, 10)): MediaAsset | null {
  const matches = assets.filter(a => a.id === id);
  if (matches.length !== 1) return null;
  const asset = matches[0];
  if (asset.status !== 'verified' || key(asset.subject) !== key(subject) ||
      publicationProblems(asset, asOf, remoteOrigins).length) return null;
  if (asset.kind === 'circuit-diagram' && (!raceId || !asset.layout?.race_ids.includes(raceId))) return null;
  return asset;
}
