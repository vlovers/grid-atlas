import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertSimpleSvg, auditPublicMedia, validateLocalFile, validatePilot } from '../scripts/validate-media-registry.mjs';
import { mediaFingerprint, parseMediaRegistry, publicationProblems, selectMediaCollection, selectMedia as select } from '../apps/web/src/components/media/registry.ts';

const asOf = '2026-10-20';
const selectMedia = (assets, id, subject, raceId, origins = []) => select(assets, id, subject, raceId, origins, asOf);
const identities = JSON.parse(readFileSync('docs/media/pilot-identities.json', 'utf8'));
const subjects = identities.subjects;
const mappings = identities.layouts;
const candidate = () => JSON.parse(readFileSync('docs/media/candidates.json', 'utf8'));
const parse = (value, lane = value.lane) => parseMediaRegistry(value, subjects, asOf, lane, [], mappings);
function approved(index = 0) {
  // Synthetic decisions derived from a candidate's structure, never saved to real files.
  const asset = candidate().assets[index];
  Object.assign(asset, { status: 'verified', creator: 'SYNTHETIC TEST CREATOR', attribution: 'Synthetic test credit',
    ai_generated: false,
    content_sha256: 'a'.repeat(64), modifications: 'None (test fixture)', rights_note: 'Synthetic rights fixture; not a real approval.',
    alt: { uk: 'Тестове зображення', en: 'Synthetic image' }, caption: { uk: 'Тестовий підпис', en: 'Synthetic caption' },
    delivery: { local_path: '/media/fixture.svg', remote_url: null } });
  asset.image.mime = 'image/svg+xml';
  asset.review = { actor: 'human', reviewer: 'SYNTHETIC INDEPENDENT REVIEWER', reviewed_on: asOf,
    note: 'Synthetic test approval only', payload_sha256: mediaFingerprint(asset) };
  return asset;
}
const envelope = asset => ({ schema_version: 2, lane: 'publication', assets: [asset] });

test('curated candidates remain private and the publication registry is empty', () => {
  const registry = parse(candidate());
  assert.equal(registry.assets.length, 5);
  for (const asset of registry.assets) {
    assert.equal(asset.status, 'candidate'); assert.equal(asset.review, null);
    assert.deepEqual(asset.delivery, { local_path: null, remote_url: null });
    assert.equal(selectMedia(registry.assets, asset.id, asset.subject, asset.layout?.race_ids[0]), null);
    assert.ok(publicationProblems(asset, asOf).length > 0);
  }
  assert.equal(parse(JSON.parse(readFileSync('apps/web/src/components/media/publication.json', 'utf8'))).assets.length, 0);
  assert.deepEqual(validatePilot(asOf), { candidates: 5, publication_assets: 0, automatic_approvals: false, image_downloads: false });
});

test('verified synthetic fixture requires creator, exact source, license, attribution and human review', () => {
  assert.equal(parse(envelope(approved())).assets.length, 1);
  for (const field of ['creator', 'source_url', 'attribution', 'rights_note', 'content_sha256', 'review']) {
    const asset = approved(); asset[field] = null;
    assert.throws(() => parse(envelope(asset)), new RegExp(field));
    assert.equal(selectMedia([asset], asset.id, asset.subject), null);
  }
  for (const field of ['identifier', 'url']) {
    const asset = approved(); asset.license[field] = null;
    assert.throws(() => parse(envelope(asset)), /license/);
  }
});

test('duplicate IDs, wrong subject kinds, unknown IDs and cross-lane approval are rejected', () => {
  const registry = candidate(); registry.assets.push(structuredClone(registry.assets[0]));
  assert.throws(() => parse(registry), /duplicate ID/);
  for (const subject of [{ type: 'driver', id: 'not-in-pinned-source' }, { type: 'entrant', id: 'ferrari' },
    { type: 'circuit', id: 'ayrton-senna' }]) {
    const asset = approved(); asset.subject = subject;
    assert.throws(() => parse(envelope(asset)), /canonical F1DB subject/);
  }
  const invalid = candidate(); invalid.assets[0] = approved();
  assert.throws(() => parse(invalid), /invalid for candidates lane/);
  assert.throws(() => parse(candidate(), 'publication'), /wrong schema, lane/);
});

test('rejected and withdrawn assets never produce a delivery selection', () => {
  for (const status of ['rejected', 'withdrawn']) {
    const asset = approved(); asset.status = status;
    assert.equal(parse(envelope(asset)).assets[0].status, status);
    assert.equal(selectMedia([asset], asset.id, asset.subject), null);
  }
  assert.equal(selectMedia([], 'missing', subjects[0]), null);
  const asset = approved();
  assert.equal(selectMedia([asset], asset.id, { type: 'constructor', id: 'ferrari' }), null);
});

test('metadata, bytes, translation and historical mapping edits invalidate review', () => {
  for (const change of [a => { a.creator = 'Changed creator'; }, a => { a.content_sha256 = 'b'.repeat(64); },
    a => { a.alt.uk = 'Змінений текст'; }, a => { a.delivery.local_path = '/media/changed.svg'; },
    a => { a.source_revision = 'changed'; }, a => { a.ai_generated = true; },
    a => { a.historical_context.year = 1988; }, a => { a.historical_context.source_url = 'https://example.org/changed-evidence'; }]) {
    const asset = approved(); change(asset);
    assert.throws(() => parse(envelope(asset)), /stale payload/);
    assert.equal(selectMedia([asset], asset.id, asset.subject), null);
  }
  const asset = approved(); asset.review.actor = 'automation';
  assert.throws(() => parse(envelope(asset)), /named human/);
  for (const date of ['2026-10-19', '2026-10-21']) {
    const asset = approved(); asset.review.reviewed_on = date;
    assert.throws(() => parse(envelope(asset)), /chronology/);
  }
});

test('publication requires explicit generation provenance and sourced historical context', () => {
  for (const mutate of [asset => { asset.ai_generated = null; }, asset => { asset.historical_context.description = null; }, asset => { asset.historical_context.source_url = null; }]) {
    const asset = approved(); mutate(asset); asset.review.payload_sha256 = mediaFingerprint(asset);
    assert.throws(() => parse(envelope(asset)), /ai_generated|historical_context/);
    assert.equal(selectMedia([asset], asset.id, asset.subject), null);
  }
  const fake = approved(); fake.ai_generated = true; fake.review.payload_sha256 = mediaFingerprint(fake);
  assert.throws(() => parse(envelope(fake)), /cannot be archival/);
  const invalid = candidate(); invalid.assets[0].historical_context.year = 2200;
  assert.throws(() => parse(invalid), /valid historical year/);
});

test('circuit diagrams require an exact pinned race/layout match, never effective/current inference', () => {
  const index = candidate().assets.findIndex(a => a.layout?.id === 'monaco-6');
  const asset = approved(index);
  parse(envelope(asset));
  assert.ok(selectMedia([asset], asset.id, asset.subject, '941'));
  assert.equal(selectMedia([asset], asset.id, asset.subject, '394'), null);
  assert.equal(selectMedia([asset], asset.id, asset.subject), null);
  asset.layout.race_ids = ['394'];
  asset.review.payload_sha256 = mediaFingerprint(asset);
  assert.throws(() => parse(envelope(asset)), /mapping mismatch/);
});

test('remote delivery is disabled by default and traversal/script URLs cannot publish', () => {
  const asset = approved();
  asset.delivery = { local_path: null, remote_url: 'https://media.example.org/revision/image.svg' };
  asset.review.payload_sha256 = mediaFingerprint(asset);
  assert.throws(() => parse(envelope(asset)), /remote origin not approved/);
  assert.equal(selectMedia([asset], asset.id, asset.subject), null);
  assert.ok(parseMediaRegistry(envelope(asset), subjects, asOf, 'publication', ['https://media.example.org'], mappings));
  for (const path of ['/media/../private.svg', '/media/%2e%2e/private.svg', '//example.org/media.svg', 'javascript:alert(1)']) {
    const asset = approved(); asset.delivery.local_path = path;
    assert.throws(() => parse(envelope(asset)), /local_path/);
  }
  const bad = approved(); bad.file_page_url = 'javascript:alert(1)';
  assert.throws(() => parse(envelope(bad)), /HTTPS document/);
});

test('simple SVG validation rejects active content, external references and malformed attributes', () => {
  assertSimpleSvg('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><path d="M0 0L1 1" fill="none" /></svg>');
  for (const source of [
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" fill="url(https://example.org/file)" /></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject /></svg>',
    '<!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg"></svg>',
  ]) assert.throws(() => assertSimpleSvg(source), /SVG:/);
});

test('reviewed local media bypasses locale redirects without bypassing ordinary archive routes', () => {
  const source = readFileSync('apps/web/src/middleware.ts', 'utf8');
  const pattern = JSON.parse('"' + source.match(/matcher: '([^']+)'/)[1] + '"');
  const matches = new RegExp('^' + pattern + '$');
  for (const path of ['/media/photo.jpg', '/media/layout.svg', '/robots.txt']) assert.equal(matches.test(path), false);
  for (const path of ['/en/drivers/1', '/uk/circuits', '/ordinary.txt', '/mediator']) assert.equal(matches.test(path), true);
});

test('local file preflight checks bytes, SVG profile, MIME and public-directory containment', t => {
  const directory = mkdtempSync(join(tmpdir(), 'grid-atlas-media-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const publicRoot = join(directory, 'public');
  mkdirSync(join(publicRoot, 'media'), { recursive: true });
  const asset = approved();
  const path = join(publicRoot, 'media/fixture.svg');
  const write = bytes => {
    writeFileSync(path, bytes);
    asset.content_sha256 = createHash('sha256').update(bytes).digest('hex');
  };
  write('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1" /></svg>');
  validateLocalFile(asset, publicRoot);
  asset.content_sha256 = '0'.repeat(64);
  assert.throws(() => validateLocalFile(asset, publicRoot), /checksum mismatch/);
  write('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
  assert.throws(() => validateLocalFile(asset, publicRoot), /SVG:/);
  write('not a JPEG'); asset.image.mime = 'image/jpeg';
  assert.throws(() => validateLocalFile(asset, publicRoot), /Truncated or oversized image|declared image MIME/);
  rmSync(path);
  writeFileSync(join(directory, 'outside.svg'), 'outside');
  symlinkSync(join(directory, 'outside.svg'), path);
  assert.throws(() => validateLocalFile(asset, publicRoot), /escapes public directory/);
});

test('public media must be registered and verified; withdrawal requires removing served bytes', t => {
  const publicRoot = mkdtempSync(join(tmpdir(), 'grid-atlas-public-media-test-'));
  t.after(() => rmSync(publicRoot, { recursive: true, force: true }));
  mkdirSync(join(publicRoot, 'media'));
  const asset = approved();
  const bytes = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>';
  writeFileSync(join(publicRoot, 'media/fixture.svg'), bytes);
  asset.content_sha256 = createHash('sha256').update(bytes).digest('hex');
  auditPublicMedia([asset], publicRoot);
  assert.throws(() => auditPublicMedia([], publicRoot), /unregistered/);
  for (const status of ['withdrawn', 'rejected']) {
    asset.status = status;
    assert.throws(() => auditPublicMedia([asset], publicRoot), /withdrawn/);
  }
  rmSync(join(publicRoot, 'media/fixture.svg'));
  auditPublicMedia([asset], publicRoot);
});


test('subject galleries retain review, withdrawal, kind and exact-identity boundaries', () => {
  const image=approved();
  assert.deepEqual(selectMediaCollection([image],image.subject,asOf).map(a=>a.id),[image.id]);
  assert.deepEqual(selectMediaCollection([image],{type:'constructor',id:image.subject.id},asOf),[]);
  const illustration=approved();illustration.kind='car-illustration';illustration.review.payload_sha256=mediaFingerprint(illustration);
  assert.deepEqual(selectMediaCollection([illustration],illustration.subject,asOf),[]);
  const stale=approved();stale.caption.en='Changed without re-review';
  assert.deepEqual(selectMediaCollection([stale],stale.subject,asOf),[]);
  const withdrawn=approved();withdrawn.status='withdrawn';
  assert.deepEqual(selectMediaCollection([withdrawn],withdrawn.subject,asOf),[]);
  const car=approved();car.subject={type:'constructor',id:'fixture-constructor'};car.kind='car-illustration';car.review.payload_sha256=mediaFingerprint(car);
  assert.equal(selectMediaCollection([car],car.subject,asOf).length,1);
  const contour=approved();contour.subject={type:'circuit',id:'fixture-circuit'};contour.kind='circuit-diagram';contour.review.payload_sha256=mediaFingerprint(contour);
  assert.deepEqual(selectMediaCollection([contour],contour.subject,asOf),[]);
});
