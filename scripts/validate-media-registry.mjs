import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseMediaRegistry } from '../apps/web/src/components/media/registry.ts';
import { inspectPublishedRaster } from './inspect-public-raster.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = path => JSON.parse(readFileSync(path, 'utf8'));

/** Intentionally narrow static SVG profile, not a general SVG sanitizer. */
export function assertSimpleSvg(source) {
  const clean = source.replace(/<!--[\s\S]*?-->/g, '').trim();
  const tags = clean.match(/<[^>]*>/g) ?? [];
  if (!tags[0]?.startsWith('<svg ') || tags.at(-1) !== '</svg>' ||
      clean.replace(/<[^>]*>/g, '').trim()) throw new Error('SVG: unsupported document structure');
  for (const [i, tag] of tags.entries()) {
    if (i === tags.length - 1) continue;
    const match = tag.match(i === 0 ? /^<svg\s+([\s\S]*?)>$/ : /^<path\s+([\s\S]*?)\/>$/);
    if (!match) throw new Error('SVG: only a root svg and self-closing path elements are allowed');
    const allowed = i === 0 ? ['xmlns', 'width', 'height', 'viewBox', 'xml:space']
      : ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];
    const seen = new Set();
    const remaining = match[1].replace(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*')/g, (_all, name, quoted) => {
      if (!allowed.includes(name) || seen.has(name)) throw new Error('SVG: unsafe or duplicate attribute');
      seen.add(name);
      const value = quoted.slice(1, -1);
      const valid = name === 'xmlns' ? value === 'http://www.w3.org/2000/svg'
        : name === 'xml:space' ? ['preserve', 'default'].includes(value)
        : name === 'd' ? /^[MmZzLlHhVvCcSsQqTtAaEe\d.,+\s-]+$/.test(value)
        : ['fill', 'stroke'].includes(name) ? /^(none|currentColor|#[a-f\d]{3,8}|[a-z]{1,20})$/i.test(value)
        : ['stroke-linecap', 'stroke-linejoin'].includes(name) ? /^(butt|round|square|miter|bevel)$/.test(value)
        : /^[\d.eE+\s,-]+$/.test(value);
      if (!valid) throw new Error('SVG: unsupported attribute value');
      return '';
    });
    if (remaining.trim()) throw new Error('SVG: malformed attributes');
  }
}

export function validateLocalFile(asset, publicRoot) {
  if (asset.status !== 'verified' || !asset.delivery.local_path) return;
  const base = realpathSync(publicRoot);
  const path = realpathSync(join(base, asset.delivery.local_path.slice(1)));
  if (!path.startsWith(base + sep)) throw new Error(`${asset.id}: file escapes public directory`);
  if (statSync(path).size > 20 * 1024 * 1024) throw new Error(`${asset.id}: file exceeds the 20 MiB pilot limit`);
  const bytes = readFileSync(path);
  if (createHash('sha256').update(bytes).digest('hex') !== asset.content_sha256) throw new Error(`${asset.id}: local file checksum mismatch`);
  if (asset.image.mime === 'image/svg+xml') assertSimpleSvg(bytes.toString('utf8'));
  else inspectPublishedRaster(bytes, asset.image);
}

export function auditPublicMedia(assets, publicRoot) {
  for (const asset of assets) validateLocalFile(asset, publicRoot);
  const allowed = new Set(assets.filter(a => a.status === 'verified').map(a => a.delivery.local_path));
  function inspect(directory, prefix = '/media') {
    if (!existsSync(directory)) return;
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const local = `${prefix}/${item.name}`;
      if (item.isDirectory()) inspect(join(directory, item.name), local);
      else if (!allowed.has(local)) throw new Error(`Public media file is unregistered, rejected or withdrawn: ${local}`);
    }
  }
  inspect(join(publicRoot, 'media'));
}

export function validatePilot(asOf) {
  const identity = json(join(root, 'docs/media/pilot-identities.json'));
  const candidates = parseMediaRegistry(json(join(root, 'docs/media/candidates.json')), identity.subjects, asOf, 'candidates', [], identity.layouts);
  const publication = parseMediaRegistry(json(join(root, 'apps/web/src/components/media/publication.json')), identity.subjects, asOf, 'publication', [], identity.layouts);
  auditPublicMedia(publication.assets, join(root, 'apps/web/public'));
  return { candidates: candidates.assets.length, publication_assets: publication.assets.filter(a => a.status === 'verified').length,
    automatic_approvals: false, image_downloads: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'as-of': { type: 'string' } } });
    if (!values['as-of']) throw new Error('Required: --as-of YYYY-MM-DD');
    console.log(JSON.stringify(validatePilot(values['as-of']), null, 2));
  } catch (error) { console.error(`Media preflight failed: ${error.message}`); process.exitCode = 1; }
}
