import snapshot from '../../../../../../docs/media/circuit-intake-410/archive-snapshot.json';
import intake from '../../../../../../docs/media/circuit-intake-410/intake.json';
import observations from '../../../../../../docs/media/circuit-intake-410/source-observations.json';
import publication from '../publication.json';
import { selectMediaCollection, type MediaRegistry } from '../registry';

/** A design proposal consumes archive facts, never editorial stories or private URLs. */
export const circuitVisualContexts = intake.entries.map(entry => {
  const circuit = snapshot.circuits.find(row => row.id === entry.circuit_id)!;
  const race = snapshot.races.find(row => String(row.id) === entry.reference_race_id)!;
  const sources = observations.observations.filter(row => entry.candidate_ids.includes(row.candidate_id));
  const years = snapshot.years_by_circuit[entry.circuit_id as keyof typeof snapshot.years_by_circuit];
  return { id: circuit.id, name: circuit.fullName ?? circuit.name, place: circuit.placeName, country: circuit.countryId,
    year: race.year, raceId: String(race.id), layout: race.circuitLayoutId, length: race.courseLength, years,
    officialName: race.officialName, sources, caveats: entry.caveats,
    approvedPhotoCount: selectMediaCollection((publication as MediaRegistry).assets, { type: 'circuit', id: circuit.id }).length };
});
export type CircuitVisualContext = (typeof circuitVisualContexts)[number];
export const archiveReleaseUrl = 'https://github.com/f1db/f1db/releases/tag/v2026.17.0';
export const approvedPublicationAssets = (publication as MediaRegistry).assets;
