/** Explicit local research review only. Never imported by the public web app. */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const draftPath = new URL('../docs/editorial/stories/senna-prost-rivalry.en-uk.draft.md', import.meta.url);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function reviewChapters(markdown, locale) {
  const heading = locale === 'uk' ? '## UK —' : '## EN —';
  const start = markdown.indexOf(heading);
  if (start < 0) throw new Error('Requested research locale is missing');
  const end = markdown.indexOf('\n## ', start + heading.length);
  const body = markdown.slice(start, end < 0 ? undefined : end);
  return body.split('\n### ').slice(1).map(section => {
    const [title, ...lines] = section.split('\n');
    return { title, body: lines.join('\n').trim() };
  });
}

export function renderReview(markdown, locale, base) {
  const uk = locale === 'uk';
  const chapters = reviewChapters(markdown, locale);
  const check = uk ? 'Перед людським схваленням' : 'Before human approval';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>UNPUBLISHED · Senna × Prost review</title><style>
    *{box-sizing:border-box}html{background:#10171d;color:#eee;font:17px/1.8 system-ui,sans-serif}body{max-width:1050px;margin:auto;padding:28px 24px}a{color:#ffb298}a:focus-visible,summary:focus-visible{outline:2px solid #ffb298;outline-offset:4px}.warning{border:2px solid #ffb298;padding:20px;font-weight:700}.warning p{font-size:.85rem;font-weight:400}.switch{display:flex;gap:24px;margin:20px 0}h1{font-size:clamp(2rem,6vw,4rem);line-height:1.1}h2{font-size:1.5rem;line-height:1.3}section{border-top:1px solid #55616c;padding:22px 0;scroll-margin-top:24px}.body{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}nav a{display:block;padding:8px 0}summary{cursor:pointer;padding:12px 0}.checklist{background:#1c272e;padding:22px}li{margin:12px 0}small{display:block;color:#c3cbd1}</style></head><body>
    <div class="warning"><strong>${uk ? 'НЕОПУБЛІКОВАНА ДОСЛІДНИЦЬКА ЧЕРНЕТКА · НЕ СХВАЛЕНО' : 'UNPUBLISHED RESEARCH DRAFT · NOT APPROVED'}</strong><p>${uk ? 'Лише локальний перегляд. Це не біографія з публічного API та не свідчення редакційного схвалення.' : 'Local review only. This is not a public API biography or evidence of editorial approval.'}</p></div>
    <div class="switch"><a href="${base}/uk">Українська</a><a href="${base}/en">English</a></div>
    <h1>Senna × Prost</h1><small>${uk ? 'Посилання з рукопису показано як текст: маршрути ще потребують перевірки.' : 'Manuscript links remain text: destinations still require review.'}</small>
    <nav aria-label="${uk ? 'Розділи чернетки' : 'Draft chapters'}">${chapters.map((c, i) => `<a href="#review-${i}">${escape(c.title)}</a>`).join('')}</nav>
    ${chapters.map((c, i) => `<section id="review-${i}" tabindex="-1"><h2>${escape(c.title)}</h2><div class="body">${escape(c.body)}</div></section>`).join('')}
    <aside class="checklist"><h2>${check}</h2><ul>
      <li>${uk ? 'Відокремити факти класифікації від спірних тверджень про мотиви у Судзуці.' : 'Separate classification facts from disputed Suzuka motive claims.'}</li>
      <li>${uk ? 'Зіставити кожне твердження з точним джерелом і перевірити гоночні ID та історичний залік очок.' : 'Map each claim to exact source evidence; verify race IDs and historical scoring.'}</li>
      <li>${uk ? 'Незалежно перевірити українську й англійську версії та права на медіа.' : 'Independently review Ukrainian and English wording and media rights.'}</li>
      <li>${uk ? 'Використати наявний процес редакційного схвалення. Ця сторінка не публікує і не підписує контент.' : 'Use the existing editorial approval workflow. This page cannot publish or sign content.'}</li>
    </ul></aside>
    <details><summary>${uk ? 'Реєстр джерел і застереження з рукопису' : 'Manuscript source register and caveats'}</summary><pre class="body">${escape(markdown.slice(markdown.indexOf('## Source and claim register')))}</pre></details>
    </body></html>`;
}

export function startReview({ port = 3359, acknowledged = false, render } = {}) {
  if (!acknowledged) throw new Error('Required: --acknowledge-unreviewed-draft. No publication or human approval is implied.');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer from 0 to 65535');
  const markdown = render ? null : readFileSync(draftPath, 'utf8');
  const token = randomBytes(24).toString('hex');
  const base = `/review/${token}`;
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const expectedHost = `127.0.0.1:${server.address().port}`;
    if (request.headers.host !== expectedHost || request.socket.remoteAddress !== '127.0.0.1' ||
        request.method !== 'GET' || ![`${base}/uk`, `${base}/en`].includes(request.url)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); return;
    }
    const locale = request.url.endsWith('/uk') ? 'uk' : 'en';
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(render ? render(locale, base) : renderReview(markdown, locale, base));
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}${base}/en`;
    if (process.send) process.send({ url }); else console.log(`UNPUBLISHED local review (do not expose or forward this port): ${url}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'acknowledge-unreviewed-draft': { type: 'boolean' }, port: { type: 'string' } } });
    const server = startReview({ port: values.port === undefined ? 3359 : Number(values.port), acknowledged: values['acknowledge-unreviewed-draft'] });
    process.once('SIGTERM', () => server.close());
    process.once('SIGINT', () => server.close());
  } catch (error) { console.error(`Story review not started: ${error.message}`); process.exitCode = 1; }
}
