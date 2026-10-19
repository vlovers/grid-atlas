import { notFound } from 'next/navigation';
import { parseExplorerGraph, parseConstructorExplorerGraph, type ExplorerGraph } from './explorer-contract';

const apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:3001';

/** Object response reader distinct from the catalogue array reader. */
export async function getExplorerGraph(driverId: string, year: number): Promise<ExplorerGraph> {
  const path = `/api/explorer/drivers/${encodeURIComponent(driverId)}/connections?year=${year}`;
  let response: Response;
  try {
    response = await fetch(new URL(path, apiBase), {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('Grid Atlas Explorer request failed:', path, error);
    throw new Error('Explorer data is temporarily unavailable.', { cause: error });
  }
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Explorer API status ${response.status}`);
  let payload: unknown;
  try {
    payload = await response.json();
    return parseExplorerGraph(payload, driverId, year);
  } catch (error) {
    console.error('Grid Atlas Explorer response invalid:', path, error);
    throw new Error('Explorer data is temporarily unavailable.', { cause: error });
  }
}

/** Reciprocal constructor-focused object response; never route through catalogue getData. */
export async function getConstructorExplorerGraph(constructorId: string, year: number): Promise<ExplorerGraph> {
  const path = `/api/explorer/constructors/${encodeURIComponent(constructorId)}/connections?year=${year}`;
  let response: Response;
  try {
    response = await fetch(new URL(path, apiBase), {
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('Grid Atlas constructor Explorer request failed:', path, error);
    throw new Error('Explorer data is temporarily unavailable.', { cause: error });
  }
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Explorer API status ${response.status}`);
  try {
    const payload: unknown = await response.json();
    return parseConstructorExplorerGraph(payload, constructorId, year);
  } catch (error) {
    console.error('Grid Atlas constructor Explorer response invalid:', path, error);
    throw new Error('Explorer data is temporarily unavailable.', { cause: error });
  }
}
