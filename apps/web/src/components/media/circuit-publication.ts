import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseMediaRegistry, selectMedia, selectMediaCollection, type MediaAsset } from './registry.ts';
import { validateLocalFile } from './local-file.mjs';
import type { CircuitLayout, CircuitTechnicalEvent } from '../circuit-experience';

// Both documented starts are supported: pnpm --filter web, and next start apps/web.
const webRoot = () => existsSync(join(process.cwd(), 'apps/web/src/components/media/publication.json'))
  ? join(process.cwd(), 'apps/web') : process.cwd();

/** Read each request: withdrawal must not depend on a cached import or a rebuild. */
export async function readCircuitPublication(circuitId: string, layouts: readonly CircuitLayout[], events: readonly CircuitTechnicalEvent[],
  path = process.env.CIRCUIT_MEDIA_PUBLICATION_FILE ?? join(webRoot(), 'src/components/media/publication.json'),
  asOf = new Date().toISOString().slice(0, 10), publicRoot = join(webRoot(), 'public')): Promise<MediaAsset[]> {
  try {
    const registry = JSON.parse(await readFile(path, 'utf8'));
    if (registry.schema_version !== 2 || registry.lane !== 'publication' || !Array.isArray(registry.assets)) return [];
    const subjects = [{ type: 'circuit' as const, id: circuitId }, ...events.flatMap(event =>
      event.external_race_id ? [{ type: 'race' as const, id: event.external_race_id }] : [])];
    const mappings = layouts.map(layout => ({ id: layout.external_layout_id, circuit_id: circuitId,
      race_ids: events.filter(event => event.layout_id === layout.id && event.external_layout_id === layout.external_layout_id && event.external_race_id)
        .map(event => event.external_race_id!) }));
    const duplicateIds = new Set(registry.assets.filter((asset: MediaAsset, index: number, all: MediaAsset[]) =>
      all.findIndex(row => row?.id === asset?.id) !== index).map((asset: MediaAsset) => asset?.id));
    return registry.assets.filter((asset: MediaAsset) => {
      if (asset?.subject?.type !== 'circuit' || asset.subject.id !== circuitId || duplicateIds.has(asset.id)) return false;
      try {
        parseMediaRegistry({ ...registry, assets: [asset] }, subjects, asOf, 'publication', [], mappings);
        validateLocalFile(asset, publicRoot);
      }
      catch { return false; }
      if (asset.kind === 'circuit-diagram') return asset.layout!.race_ids.some(race =>
        selectMedia([asset], asset.id, { type: 'circuit', id: circuitId }, race, [], asOf));
      return selectMediaCollection([asset], { type: 'circuit', id: circuitId }, asOf).length === 1;
    });
  } catch { return []; }
}
