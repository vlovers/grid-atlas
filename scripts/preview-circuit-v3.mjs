/** Private review transport is shared with the existing editorial workflow. */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { startReview } from './preview-story-review.mjs';
import { candidateCircuitNarratives, candidateCornerGuides, candidateCornerSources } from '../apps/web/src/components/editorial/circuit-candidates.ts';

const root = new URL('../', import.meta.url);
const corners = { guides: candidateCornerGuides, sources: candidateCornerSources };
const narratives = { entries: candidateCircuitNarratives };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function renderCircuitReview(locale, base) {
  const uk = locale === 'uk';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>UNPUBLISHED · Circuit V3 review</title><style>
  *{box-sizing:border-box}html{background:#090b0d;color:#f0ece4;font:17px/1.8 system-ui}body{max-width:1200px;margin:auto;padding:24px}a{color:#ed8278}h1,h2,h3{font-family:Georgia,serif;line-height:1.2;overflow-wrap:anywhere}h1{font-size:clamp(2.5rem,6vw,5rem)}h2{font-size:2.5rem}h3{font-size:1.6rem}.warning{padding:18px;border:2px solid #d6bc8a}nav{display:flex;flex-wrap:wrap;gap:16px}a,summary{min-height:44px;align-content:center}a:focus-visible,summary:focus-visible,article:target{outline:3px solid #d6bc8a;outline-offset:4px}section{margin-block:3rem;border-top:1px solid #34383b;padding-top:2rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:2rem}.grid article{border-top:1px solid #34383b;padding-top:1rem;scroll-margin-top:24px}.diagramViewport{overflow-x:auto;max-width:100%;padding-block:12px}.diagram{position:relative;width:620px;min-width:620px;max-width:620px;aspect-ratio:1;margin:2rem auto;background:#141719}.diagram>svg{width:100%;height:100%}.diagram>a{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;min-width:44px;min-height:44px;border:1px solid #d6bc8a;background:#141719;color:#f0ece4;text-decoration:none;font-size:14px;border-radius:50%}.diagram line{stroke:#d6bc8a;stroke-width:1.5}small{color:#a9adb0}summary{cursor:pointer}article p{max-width:75ch}</style></head><body>
  <div class="warning"><strong>${uk ? 'НЕОПУБЛІКОВАНА ЧЕРНЕТКА · НЕ СХВАЛЕНО' : 'UNPUBLISHED DRAFT · NOT APPROVED'}</strong><p>${uk ? 'Локальний перегляд нових сюжетів і назв. Перевірка джерел за допомогою ШІ не є незалежним людським схваленням. Цей інтерфейс не публікує й не підписує тексти.' : 'Local review of new stories and names. AI source checking is not independent human approval. This interface cannot publish or sign content.'}</p></div>
  <nav><a href="${base}/uk">Українська</a><a href="${base}/en">English</a>${narratives.entries.map(entry => `<a href="#${entry.circuit_id}">${escape(entry.circuit_id)}</a>`).join('')}</nav>
  <h1>Circuit Experience V3</h1>
  ${narratives.entries.map(entry => {
    const guide = corners.guides.find(item => item.circuit_id === entry.circuit_id);
    let diagram = '';
    if (guide?.diagram) {
      // Only the repository-audited, exact local artwork can be embedded, never a downloaded FIA map.
      if (guide.diagram.asset !== '/circuit-layouts/monaco-6.svg') throw new Error('Unreviewed diagram asset');
      const svg = readFileSync(new URL(`apps/web/public${guide.diagram.asset}`, root), 'utf8').replace('width="500" height="500"', 'viewBox="0 0 500 500" role="img" aria-label="Monaco 2025 layout illustration"');
      const lines = guide.diagram.points.map(point => `<line x1="${point.anchor[0]}" y1="${point.anchor[1]}" x2="${point.label[0]}" y2="${point.label[1]}"/>`).join('');
      diagram = `<p>${uk ? 'Прокрутіть схему горизонтально або оберіть номер зі списку.' : 'Scroll the diagram horizontally or choose a number from the list.'}</p><div class="diagramViewport" role="region" tabindex="0" aria-label="${uk ? 'Пронумерована схема Монако' : 'Numbered Monaco diagram'}"><div class="diagram">${svg.replace('</svg>', `${lines}</svg>`)}${guide.diagram.points.map(point => {
        const section = guide.sections.find(item => item.numbers.includes(point.number));
        return `<a href="#${section.id}" style="left:${point.label[0]/5}%;top:${point.label[1]/5}%" aria-label="${point.number} · ${escape(section.name ?? (uk ? 'Без окремої назви' : 'No individual name'))}">${point.number}</a>`;
      }).join('')}</div></div><small>Jules Roy · <a href="https://github.com/f1db/f1db/tree/v2026.17.0">F1DB v2026.17.0</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · ${uk ? 'Додано приблизні маркери за схемою FIA 2025; це ілюстрація, не геодезична карта.' : 'Approximate annotations added using the FIA 2025 map; illustration, not a surveyed map.'}</small>`;
    }
    return `<section id="${entry.circuit_id}"><h2>${escape(entry.biography.title[locale])}</h2><p>${escape(entry.biography.text[locale])}</p><a href="${escape(entry.biography.source)}">${uk ? 'Джерело' : 'Source'} ↗</a>
      ${guide ? `<h3>${uk ? 'Дослідіть повороти' : 'Explore the corners'} · ${guide.numbered_turns}</h3><p>${escape(guide.layout_id)} · FIA ${guide.numbering_year} / F1.com ${guide.names_as_of}</p>${diagram}<nav aria-label="${uk ? 'Повороти за порядком' : 'Corners in lap order'}">${guide.sections.flatMap(section => section.numbers.map(number => `<a href="#${section.id}">T${number}</a>`)).join('')}</nav><div class="grid">${guide.sections.map(section => `<article id="${section.id}" tabindex="-1"><small>T${section.numbers.join(' / ')}</small><h3>${escape(section.name ?? (uk ? 'Без окремої назви' : 'No individual name'))}</h3>${section.explanation ? `<p>${escape(section.explanation[locale])}</p>` : ''}<p>${section.aliases.map(escape).join(' · ')}</p>${section.sources.map(id => `<a href="${escape(corners.sources[id])}">${escape(id)} ↗</a>`).join(' · ')}</article>`).join('')}</div>` : ''}
      <h3>${uk ? 'Легендарні моменти — кандидати' : 'Memorable moments — candidates'}</h3><div class="grid">${entry.moments.map(moment => `<article><small>${moment.year} · ${escape(moment.criterion)}</small><h3>${escape(moment.title[locale])}</h3><p>${escape(moment.text[locale])}</p><a href="${escape(moment.source)}">Formula 1 · ${escape(moment.locator)} ↗</a></article>`).join('')}</div></section>`;
  }).join('')}</body></html>`;
}

export const startCircuitReview = options => startReview({ ...options, render: renderCircuitReview });
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'acknowledge-unreviewed-draft': { type: 'boolean' }, port: { type: 'string' } } });
    const server = startCircuitReview({ acknowledged: values['acknowledge-unreviewed-draft'], port: values.port === undefined ? 3468 : Number(values.port) });
    process.once('SIGTERM', () => server.close()); process.once('SIGINT', () => server.close());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
