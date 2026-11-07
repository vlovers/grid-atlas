import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { inspectPublishedRaster } from "../../../../../scripts/inspect-public-raster.mjs";

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
