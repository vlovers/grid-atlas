import { parsePublishedArticle, type PublishedArticle } from '@/components/stories/published-article';
export type { PublishedArticle } from '@/components/stories/published-article';
import { notFound } from 'next/navigation';
import { ApiRequestError, optionalEnrichment, requestApi, requestArray } from './api-client';

export type Season = { year: number };
export type Driver = { id: string; name: string; external_id: string };
export type CatalogueEntity = { id: string; name: string; external_id: string; first_season?: number | null; last_season?: number | null; races?: number; wins?: number; titles?: number | null };
export type Race = { id: string; round: number; race_date: string | null; official_name: string; circuit_id: string | null; circuit_name: string | null };
export type RaceProfile = Race & { season_year: number; external_id: string };
export type Result = { position_display_order: number; position_number: number | null; position_text: string; driver_id: string; driver: string; constructor_id: string; constructor: string; points: string | null; laps: number | null; reason_retired: string | null; shared_car: boolean };
export async function getData<T>(path: string): Promise<T[]> {
  try { return await requestArray<T>(path); }
  catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}

/** Optional connections preserve an explicit failure state and bounded latency. */
export const getOptionalArchiveData = <T,>(path: string) =>
  optionalEnrichment(() => requestArray<T>(path, { timeoutMs: 2000 }));

/** A missing article is expected; transport errors are not silently swallowed. */
export async function getPublishedArticle(driverId: string, locale: 'uk' | 'en', timeoutMs = 8000): Promise<PublishedArticle | null> {
  const path = `/api/drivers/${driverId}/article?locale=${locale}`;
  try {
    const payload = await requestApi(path, { timeoutMs });
    try {
      if (!payload || typeof payload !== 'object' || !('data' in payload)) throw new Error();
      return parsePublishedArticle(payload.data, locale);
    } catch {
      console.error({ event: 'editorial_api_failed', endpoint: '/api/drivers/:id/article', reason: 'contract' });
      throw new ApiRequestError('contract');
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

/** Optional prose has its own state and a shorter budget than essential records. */
export const getOptionalPublishedArticle = (id: string, locale: 'uk' | 'en') =>
  optionalEnrichment(() => getPublishedArticle(id, locale, 2000));

/** Separate circuit publication boundary; never read draft bundles or client-side approval flags. */
export async function getPublishedCircuitArticle(circuitId: string, locale: 'uk' | 'en', timeoutMs = 8000): Promise<PublishedArticle | null> {
  const path = `/api/circuits/${circuitId}/article?locale=${locale}`;
  try {
    const payload = await requestApi(path, { timeoutMs });
    try {
      if (!payload || typeof payload !== 'object' || !('data' in payload)) throw new Error();
      return parsePublishedArticle(payload.data, locale);
    } catch {
      console.error({ event: 'editorial_api_failed', endpoint: '/api/circuits/:id/article', reason: 'contract' });
      throw new ApiRequestError('contract');
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

/** Optional reader data is bounded; a missing/invalid article never exposes research drafts. */
export const getOptionalPublishedCircuitArticle = (id: string, locale: 'uk' | 'en') =>
  optionalEnrichment(() => getPublishedCircuitArticle(id, locale, 2000));
