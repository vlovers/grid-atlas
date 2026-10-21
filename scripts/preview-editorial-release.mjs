/** Same loopback-only, no-store review transport as the existing story preview. */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { startReview } from './preview-story-review.mjs';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('docs/editorial/releases/v1/manifest.json', root), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function read(path) {
  if (!/^docs\/editorial\/[a-zA-Z0-9/._-]+\.json$/.test(path) || path.includes('..')) throw new Error('Invalid review path');
  return JSON.parse(readFileSync(new URL(path, root), 'utf8'));
}
export function renderReleaseReview(locale, base) {
  const uk = locale === 'uk';
  const pilots = manifest.drivers.map(p => ({ ...p, dossier: read(p.locales[locale].dossier), review: read(p.locales[locale].review) }));
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>UNPUBLISHED · Editorial Content V1</title><style>*{box-sizing:border-box}html{background:#0b0f14;color:#f3f0e8;font:17px/1.7 system-ui}body{max-width:1150px;margin:auto;padding:24px}a{color:#ffab98}h1{font-size:clamp(2.2rem,6vw,5rem);line-height:1}h2{font-size:2rem}nav{display:flex;gap:18px;flex-wrap:wrap}nav a{padding:10px 0}article{padding:3rem 0;border-top:1px solid #34424d;scroll-margin-top:20px}.warning{border:2px solid #ef604f;padding:20px}details{border-top:1px solid #34424d;padding:12px 0}summary{min-height:44px;cursor:pointer;font-weight:700}.claim{padding:1rem 0;max-width:80ch}.label,small{color:#99a6b2}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere;font-size:.85rem}a:focus-visible,summary:focus-visible{outline:3px solid #ef604f;outline-offset:5px}.check{background:#131c25;padding:20px}li{margin-bottom:1rem}</style></head><body>
  <div class="warning"><strong>${uk ? 'НЕОПУБЛІКОВАНО · НЕ СХВАЛЕНО · ЛОКАЛЬНИЙ REVIEW' : 'UNPUBLISHED · NOT APPROVED · LOCAL REVIEW'}</strong><p>${uk ? 'Перевірка структури не є людським схваленням. Ця сторінка не може підписувати або публікувати тексти.' : 'Structural validation is not human approval. This page cannot sign or publish content.'}</p></div>
  <nav aria-label="${uk ? 'Мова' : 'Language'}"><a href="${base}/uk">Українська</a><a href="${base}/en">English</a></nav><h1>Editorial Content V1</h1>
  <nav aria-label="${uk ? 'Пілоти' : 'Drivers'}">${pilots.map(p => `<a href="#${p.driver_id}">${escape(p.dossier.title)}</a>`).join('')}</nav>
  ${pilots.map(({ driver_id, dossier: d, review: r, locales }) => `<article id="${driver_id}" tabindex="-1"><p class="label">${escape(driver_id)} / ${locale} / ${escape(r.stage)}</p><h2>${escape(d.title)}</h2>
  <p><code>${escape(locales[locale].dossier)}</code></p><p>${uk ? 'Авторський запис' : 'Authorship record'}: ${escape(d.author)}</p>
  ${d.sections.map((section, index) => `<details ${index === 0 ? 'open' : ''}><summary>${escape(section.title)}</summary>${section.claim_ids.map(id => {
    const c = d.claims.find(c => c.claim_id === id), interpretation = locales[locale].attributed_interpretation_claims.includes(id);
    return `<div class="claim"><small>${interpretation ? (uk ? 'Атрибутована інтерпретація' : 'Attributed interpretation') : (uk ? 'Твердження джерела' : 'Source statement')} · ${escape(id)} · ${r.claim_reviews[id] === null ? (uk ? 'Людської перевірки немає' : 'No human review') : 'REVIEW RECORDED; validate exact revision'}</small><p>${escape(c.statement)}</p><ul>${c.evidence.map(e => {const s = d.sources.find(s => s.source_id === e.source_id);return `<li><a href="${escape(s.source_url)}" rel="noreferrer">${escape(s.title)}</a> — ${escape(s.publisher)} · ${escape(r.sources[s.source_id].kind)}<p>${escape(e.locator)}</p><small>${escape(s.version)} · ${escape(s.accessed_on)}</small></li>`;}).join('')}</ul></div>`;
  }).join('')}</details>`).join('')}
  <aside class="check"><h3>${uk ? 'Що залишається перевірити' : 'Remaining editorial work'}</h3><ul>${d.gaps.map(g => `<li>${escape(g)}</li>`).join('')}</ul><details><summary>${uk ? 'Метадані review та джерел' : 'Review & source metadata'}</summary><pre><code>${escape(JSON.stringify(r, null, 2))}</code></pre></details></aside></article>`).join('')}</body></html>`;
}
export function startReleaseReview(options = {}) { return startReview({ ...options, render: renderReleaseReview }); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'acknowledge-unreviewed-draft': { type: 'boolean' }, port: { type: 'string' } } });
    const server = startReleaseReview({ port: values.port === undefined ? 3429 : Number(values.port), acknowledged: values['acknowledge-unreviewed-draft'] });
    process.once('SIGTERM', () => server.close()); process.once('SIGINT', () => server.close());
  } catch (error) { console.error(`Release review not started: ${error.message}`); process.exitCode = 1; }
}
