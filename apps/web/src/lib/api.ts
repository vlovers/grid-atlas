import { notFound } from 'next/navigation';

const base = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
export type Season = { year: number };
export type Driver = { id: string; name: string; external_id: string };
export type Race = { id: string; round: number; race_date: string | null; official_name: string; circuit_id: string | null; circuit_name: string | null };
export type RaceProfile = Race & { season_year: number; external_id: string };
export type Result = { position_display_order: number; position_number: number | null; position_text: string; driver_id: string; driver: string; constructor_id: string; constructor: string; points: string | null; laps: number | null; reason_retired: string | null; shared_car: boolean };
export async function getData<T>(path: string): Promise<T[]> {
  let res: Response;
  try {
    res = await fetch(new URL(path, base), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  } catch (error) {
    console.error('Grid Atlas API request failed:', path, error);
    throw new Error('Исторические данные сейчас недоступны. Попробуйте позже.', { cause: error });
  }
  // Keep missing records distinct from API outages, including metadata requests.
  if (res.status === 404) notFound();
  try {
    if (!res.ok) throw new Error('API status ' + res.status);
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object' || !('data' in data) || !Array.isArray(data.data)) throw new Error('Malformed API response');
    return data.data as T[];
  } catch (error) {
    console.error('Grid Atlas API request failed:', path, error);
    throw new Error('Исторические данные сейчас недоступны. Попробуйте позже.', { cause: error });
  }
}
