import registry from './circuit-layout-manifest.json';
export type CircuitArtwork = {layout_id:string;path:string;source_url:string;source_git_blob_sha:string;author:string;license:string;transform:string};
export const CIRCUIT_ARTWORK = new Map((registry as CircuitArtwork[]).map(asset => [asset.layout_id, asset]));

/** Select only artwork for a layout actually returned by the circuit API.
 * An effective layout wins; otherwise use the first sourced historical layout.
 * Never synthesize geometry or use artwork for an unrelated circuit.
 */
export function selectCircuitCoverArtwork(
  layouts: readonly { external_layout_id: string; effective: boolean }[],
): CircuitArtwork | null {
  const eligible = layouts
    .map(layout => ({ layout, artwork: CIRCUIT_ARTWORK.get(layout.external_layout_id) }))
    .filter((entry): entry is { layout: { external_layout_id: string; effective: boolean }; artwork: CircuitArtwork } => Boolean(entry.artwork));
  return (eligible.find(entry => entry.layout.effective) ?? eligible[0])?.artwork ?? null;
}
