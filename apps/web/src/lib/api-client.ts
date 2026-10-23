/** Server-side transport. Diagnostics contain templates, never origins or values. */
export class ApiRequestError extends Error {
  readonly reason: 'configuration' | 'timeout' | 'transport' | 'http' | 'contract';
  readonly status?: number;
  constructor(reason: ApiRequestError['reason'], status?: number) {
    super('Historical data is temporarily unavailable.');
    this.name = 'ApiRequestError';
    this.reason = reason;
    this.status = status;
  }
}

type Options = { base?: string; production?: boolean; timeoutMs?: number; request?: typeof fetch;
  log?: (diagnostic: Record<string, unknown>) => void };

export function apiOrigin(value: string | undefined, production: boolean): string {
  if (value === undefined && !production) return 'http://127.0.0.1:3001';
  try {
    if (!value || value !== value.trim()) throw new Error();
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new ApiRequestError('configuration'); }
}

export function apiEndpoint(path: string): string {
  // Do not echo arbitrary URL/query input into server logs.
  return path.split('?')[0].split('/').map(segment =>
    /^\d+$/.test(segment) ? ':id' : /^[a-z-]+$/.test(segment) ? segment : segment === '' ? '' : ':value').join('/');
}

export async function requestApi(path: string, options: Options = {}): Promise<unknown> {
  const started = performance.now();
  const signal = AbortSignal.timeout(options.timeoutMs ?? 8000);
  try {
    if (!path.startsWith('/api/') || [...path].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\' || char === '#')) throw new ApiRequestError('configuration');
    const base = apiOrigin(options.base ?? process.env.API_BASE_URL, options.production ?? process.env.NODE_ENV === 'production');
    const response = await (options.request ?? fetch)(new URL(path, base), { cache: 'no-store', redirect: 'error', signal });
    if (!response.ok) throw new ApiRequestError('http', response.status);
    try { return await response.json(); }
    catch { throw new ApiRequestError(signal.aborted ? 'timeout' : 'contract'); }
  } catch (error) {
    const safe = error instanceof ApiRequestError ? error : new ApiRequestError(signal.aborted ? 'timeout' : 'transport');
    // Expected missing identities/articles are handled explicitly by their caller.
    if (safe.status !== 404) (options.log ?? console.error)({ event: 'archive_api_failed', endpoint: apiEndpoint(path),
      reason: safe.reason, status: safe.status, duration_ms: Math.round(performance.now() - started) });
    throw safe;
  }
}

export function arrayData<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !Array.isArray(payload.data)) throw new ApiRequestError('contract');
  return payload.data as T[];
}

export type Enrichment<T> = { status: 'available'; value: T } | { status: 'unavailable'; value: null };
export async function optionalEnrichment<T>(load: () => Promise<T>): Promise<Enrichment<T>> {
  try { return { status: 'available', value: await load() }; }
  catch (error) {
    if (!(error instanceof ApiRequestError)) throw error;
    return { status: 'unavailable', value: null };
  }
}
