import registry from './circuit-layout-manifest.json';
export type CircuitArtwork = {layout_id:string;path:string;source_url:string;source_git_blob_sha:string;author:string;license:string;transform:string};
export const CIRCUIT_ARTWORK = new Map((registry as CircuitArtwork[]).map(asset => [asset.layout_id, asset]));
