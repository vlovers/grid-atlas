import { selectMedia, type MediaAsset } from '../registry.ts';

/** Reuse the live rights gate, with an additional exact layout/event binding. */
export function selectCircuitVisualDiagram(assets: readonly MediaAsset[], context: {
  id: string; layout: string; raceId: string;
}, asOf?: string): MediaAsset | null {
  for (const asset of assets) {
    if (asset.kind !== 'circuit-diagram' || asset.layout?.id !== context.layout) continue;
    const selected = selectMedia(assets, asset.id, { type: 'circuit', id: context.id }, context.raceId, [], asOf);
    if (selected) return selected;
  }
  return null;
}
