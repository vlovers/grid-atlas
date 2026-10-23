import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCommonsReviewHandoff } from '../scripts/build-commons-review-handoff.mjs';
import { renderCommonsReviewMarkdown } from '../scripts/render-commons-review-markdown.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const inputs = () => ({
  staging: read('docs/media/cross-era-staging.json'),
  evidence: read('docs/media/commons-original-evidence.json'),
  observations: read('docs/media/verified-original-observations.json'),
  identities: read('docs/media/pilot-identities.json'),
  candidates: read('docs/media/candidates.json'),
  publication: read('apps/web/src/components/media/publication.json'),
});
const report = () => buildCommonsReviewHandoff(inputs());

test('five bilingual human review worklists link exact pinned Commons revisions without publication approval', () => {
  const markdown = renderCommonsReviewMarkdown(report());
  const source = inputs().evidence.entries;
  assert.match(markdown, /Original SHA-256 coverage:\*\* 2\/5/);
  assert.equal((markdown.match(/^## \d+\./gm) ?? []).length, 5);
  assert.equal((markdown.match(/Rights \/ subject \/ publication:\*\* PENDING \/ PENDING \/ NOT APPROVED/g) ?? []).length, 5);
  assert.equal((markdown.match(/PENDING — original not byte-verified/g) ?? []).length, 3);
  assert.equal((markdown.match(/\[prior research run\]/g) ?? []).length, 2);
  assert.match(markdown, /Незалежна перевірка/);
  assert.match(markdown, /Перевірити автора/);
  for (const item of source) {
    assert.ok(markdown.includes('oldid=' + item.description_oldid));
    assert.ok(markdown.includes(item.sha1));
  }
  assert.ok(markdown.includes('6b0431b9d58148d4c15d6e1342aa206ec050a84967a203fdc4d5a0ee612aad5a'));
  assert.ok(!markdown.includes('!['), 'no images or automatic image embedding');
  assert.ok(!markdown.includes('<img'), 'no HTML media elements');
});

test('source-derived text cannot inject Markdown structure or HTML into review worklist', () => {
  const data = report();
  data.entries[0].commons_source.source_note = '</script><img src=x onerror=alert(1)>\n## APPROVED';
  data.entries[0].context_warning = '[fake](https://example.com) | verified';
  const markdown = renderCommonsReviewMarkdown(data);
  assert.ok(!markdown.includes('<img'));
  assert.ok(!markdown.includes('\n## APPROVED'));
  assert.ok(markdown.includes('&lt;img'));
  assert.ok(markdown.includes('\\[fake\\]'));
  assert.ok(markdown.includes('\\|'));
});

test('rejects forged approval, duplicate IDs, bad hashes and tampered coverage', () => {
  for (const mutate of [
    data => { data.entries[0].publication_allowed = true; },
    data => { data.entries[0].rights_decision = 'approved'; },
    data => { data.entries[0].reviewer = { name: 'not verified' }; },
    data => { data.entries[0].locale_text.uk.alt = 'unreviewed'; },
    data => { data.entries[1].research_id = data.entries[0].research_id; },
    data => { data.entries[0].f1db_record.record_sha256 = 'bad'; },
    data => { data.entries[0].original_binary.sha256 = '0'.repeat(64); data.entries[0].original_binary.status = 'pending_original'; },
    data => { data.binary_sha256_observed = 5; },
    data => { data.entries[0].commons_source.license_url = 'https://evil.example/licenses/by-sa/4.0/'; },
    data => { data.entries[0].commons_source.description_oldid = 0; },
  ]) {
    const data = report();
    mutate(data);
    assert.throws(() => renderCommonsReviewMarkdown(data));
  }
});
