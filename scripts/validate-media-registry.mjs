import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseMediaRegistry } from '../apps/web/src/components/media/registry.ts';
import { validateLocalFile } from '../apps/web/src/components/media/local-file.mjs';
export { assertSimpleSvg, validateLocalFile } from '../apps/web/src/components/media/local-file.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = path => JSON.parse(readFileSync(path, 'utf8'));

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
