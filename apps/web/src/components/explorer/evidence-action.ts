"use server";
import {
  getPairRaceEvidence,
  type EvidenceRace,
} from "@/lib/explorer-race-evidence";
export type EvidencePreview =
  | { status: "ready"; races: EvidenceRace[]; truncated: boolean }
  | { status: "error" };
/** Existing public API only. No new data contract, archive fetch or client API origin. */
export async function loadEvidencePreview(
  driver: string,
  constructor: string,
  year: number,
): Promise<EvidencePreview> {
  try {
    const evidence = await getPairRaceEvidence(driver, constructor, year);
    return {
      status: "ready",
      races: evidence.races.slice(0, 3),
      truncated: evidence.truncated || evidence.races.length > 3,
    };
  } catch {
    return { status: "error" };
  }
}
