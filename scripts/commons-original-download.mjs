import { setTimeout as sleep } from 'node:timers/promises';

/** Bounded transport retries only. The caller must still verify origin, size,
 * JPEG structure and BOTH pinned digests before caching an original.
 * No alternate source, checksum substitution or success on unavailable bytes.
 */
export async function downloadCommonsOriginal(url, { fetchImpl = fetch, wait = sleep, now = Date.now, onRetry = () => {} } = {}) {
  const retryable = new Set([429, 502, 503, 504]);
  const backoff = [15000, 45000, 60000];
  let waited = 0;
  for (let attempt = 0; ; attempt++) {
    const response = await fetchImpl(url, {
      headers: { 'User-Agent': 'GridAtlasMediaReview/1.0 (local noncommercial research)' },
      redirect: 'follow', signal: AbortSignal.timeout(20000),
    });
    if (response.ok) return response;
    const error = new Error('Commons download HTTP ' + response.status);
    if (!retryable.has(response.status) || attempt === backoff.length) {
      await response.body?.cancel();
      throw error;
    }
    const header = response.headers.get('retry-after');
    const seconds = header !== null && /^\d+$/.test(header.trim()) ? Number(header.trim()) : null;
    const date = header === null || seconds !== null ? NaN : Date.parse(header);
    const requested = seconds !== null ? seconds * 1000 : Number.isFinite(date) ? date - now() : backoff[attempt];
    // Retry-After is a minimum, never a reason to hammer a throttled origin.
    // Commons may return0/a past HTTP date before issuing a longer delay.
    const delay = Math.max(backoff[attempt], requested);
    await response.body?.cancel();
    // At most four20s requests and180s total waiting per original fit within
    // the25-minute workflow for all five files. Never retry earlier
    // than a server-requested delay; fail closed if it exceeds the budget.
    if (!Number.isFinite(delay) || waited + delay > 180000) {
      throw new Error(error.message + '; Retry-After exceeds bounded retry budget');
    }
    waited += delay;
    onRetry({ status: response.status, retry: attempt + 1, delay });
    await wait(delay);
  }
}
