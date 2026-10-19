type Row = { id?: unknown; year?: unknown; entity_type?: unknown; subject_id?: unknown; object_id?: unknown };
type Read = (path: string) => Promise<Row[]>;
const limit = 100;

/** Enumerate existing public records, including every API page. Fail closed on
 * incomplete/invalid responses instead of publishing a misleading partial map. */
export async function sitemapPaths(read: Read): Promise<string[]> {
  const paths = new Set(['/', '/drivers', '/constructors', '/circuits', '/seasons', '/lineage', '/sources']);
  const addId = (kind: string, id: unknown) => {
    if (typeof id !== 'string' || !/^[1-9][0-9]*$/.test(id) || Number(id) > 2147483647) throw new Error('Invalid sitemap record ID');
    paths.add(`/${kind}/${id}`);
  };
  const paginate = async (endpoint: string, kind: string) => {
    const seen = new Set<unknown>();
    for (let offset = 0; offset <= 100000; offset += limit) {
      const rows = await read(`${endpoint}?limit=${limit}&offset=${offset}`);
      if (rows.length > limit) throw new Error('Invalid sitemap page size');
      for (const row of rows) {
        if (seen.has(row.id)) throw new Error('Repeated sitemap record; pagination did not advance');
        seen.add(row.id);
        addId(kind, row.id);
      }
      if (rows.length < limit) return;
    }
    throw new Error('Sitemap exceeds API pagination limit');
  };
  const seasons = await read('/api/seasons');
  for (const season of seasons) {
    if (typeof season.year !== 'number' || !Number.isInteger(season.year) || season.year < 1950 || season.year > 2200) throw new Error('Invalid sitemap season');
    paths.add(`/seasons/${season.year}`);
    await paginate(`/api/seasons/${season.year}/races`, 'races');
  }
  for (const kind of ['drivers', 'constructors', 'circuits']) await paginate(`/api/${kind}`, kind);
  // Entrants have no catalogue API. Include those already discoverable through
  // published, verified lineage, without reading proposed or rejected claims.
  for (const edge of await read('/api/lineage/network')) {
    if (edge.entity_type === 'entrant') {
      addId('entrants', edge.subject_id);
      addId('entrants', edge.object_id);
    }
  }
  if (paths.size * 2 > 50000) throw new Error('Split the sitemap before exceeding 50,000 localized URLs');
  return [...paths].sort();
}
