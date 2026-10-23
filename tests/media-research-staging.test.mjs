import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const staging = load('docs/media/cross-era-staging.json');
const candidates = load('docs/media/candidates.json');
const publication = load('apps/web/src/components/media/publication.json');

test('research staging is isolated from both publication and strict candidate registry', () => {
  assert.equal(staging.schema_version, 1);
  assert.equal(staging.lane, 'research_only');
  assert.equal(staging.publication_allowed, false);
  assert.equal(staging.entries.length, 5);
  const ids = new Set([...candidates.assets, ...publication.assets].map(a => a.id));
  const pages = new Set([...candidates.assets, ...publication.assets].map(a => a.file_page_url));
  for (const entry of staging.entries) {
    assert.equal(entry.status, 'candidate');
    assert.equal(entry.review, null);
    assert.equal(entry.delivery.local_path, null);
    assert.equal(entry.delivery.remote_url, null);
    assert.equal(entry.content_sha256, null);
    assert.equal(entry.source_revision, null);
    assert.ok(!ids.has(entry.id), 'research ID leaked into strict registry');
    assert.ok(!pages.has(entry.file_page_url), 'file page already registered');
  }
});

test('research batch has unique IDs and canonical HTTPS Commons file pages', () => {
  const ids = new Set();
  const urls = new Set();
  for (const item of staging.entries) {
    assert.match(item.id, /^research-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!ids.has(item.id)); ids.add(item.id);
    const url = new URL(item.file_page_url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'commons.wikimedia.org');
    assert.match(url.pathname, /^\/wiki\/File:.+/);
    assert.equal(url.search, '');
    assert.equal(url.hash, '');
    assert.ok(!urls.has(url.href)); urls.add(url.href);
    assert.match(item.rights_note, /human (?:rights )?(?:review|approval)/i);
  }
});
