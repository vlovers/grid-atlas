/**
 * Research-only original SHA-256 observations are an additional integrity pin.
 * They do not establish copyright, provenance, subject identity or publication rights.
 */
export function expectedObservedSha256({ researchId, originalObservations, sourceEvidence }) {
  if (originalObservations === undefined) return null;
  if (originalObservations?.schema_version !== 1 ||
      originalObservations.lane !== 'research_only' ||
      originalObservations.publication_allowed !== false ||
      !Array.isArray(originalObservations.entries) ||
      typeof originalObservations.source_run_url !== 'string' ||
      !/^https:\/\/github\.com\/vlovers\/grid-atlas\/actions\/runs\/[0-9]+$/.test(originalObservations.source_run_url) ||
      typeof originalObservations.observed_on !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(originalObservations.observed_on) ||
      Number.isNaN(Date.parse(originalObservations.observed_on + 'T00:00:00Z')) ||
      new Date(originalObservations.observed_on + 'T00:00:00Z').toISOString().slice(0, 10) !== originalObservations.observed_on ||
      sourceEvidence?.schema_version !== 1 || sourceEvidence.lane !== 'research_only' ||
      sourceEvidence.publication_allowed !== false || !Array.isArray(sourceEvidence.entries)) {
    throw Error('Invalid research-only original SHA-256 observation register');
  }
  const sources = new Map();
  for (const source of sourceEvidence.entries) {
    if (typeof source?.research_id !== 'string' || sources.has(source.research_id)) {
      throw Error('Invalid or duplicate Commons source evidence identity');
    }
    sources.set(source.research_id, source);
  }
  const observed = new Map();
  const hashes = new Set();
  for (const item of originalObservations.entries) {
    const source = sources.get(item?.research_id);
    if (!source || observed.has(item.research_id) ||
        !/^[a-f0-9]{64}$/.test(item.sha256 ?? '') || hashes.has(item.sha256) ||
        item.sha1 !== source.sha1 || item.bytes !== source.bytes) {
      throw Error('Unpinned, conflicting or duplicate original SHA-256 observation');
    }
    observed.set(item.research_id, item.sha256);
    hashes.add(item.sha256);
  }
  return observed.get(researchId) ?? null;
}
