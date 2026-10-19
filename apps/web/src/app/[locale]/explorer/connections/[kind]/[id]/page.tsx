import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ locale: string; kind: string; id: string }>;
  searchParams: Promise<{ year?: string; offset?: string }>;
};
type Neighbor = { entity_id: string; name: string; races: number;
  result_entries: number; winning_races: number };
type Paginated = { focus: { entity_id: string; name: string; entity_type: string };
  neighbor_type: string; year: number; offset: number; limit: number;
  total: number; next_offset: number | null; neighbors: Neighbor[] };
const validId = (s: string) => /^[1-9][0-9]{0,18}$/.test(s) &&
  BigInt(s) <= 9223372036854775807n;

export default async function CompleteConnections({ params, searchParams }: PageProps) {
  const { locale, kind, id } = await params;
  const { year, offset } = await searchParams;
  if (!['uk','en'].includes(locale) || !['drivers','constructors'].includes(kind) ||
      !validId(id) || typeof year !== 'string' || !/^[0-9]{4}$/.test(year) ||
      Number(year) < 1950 || Number(year) > 2200 ||
      (offset !== undefined && (!/^(0|[1-9][0-9]{0,5})$/.test(offset) || Number(offset) > 100000))) notFound();
  const position = Number(offset ?? '0');
  const url = new URL(`/api/explorer/${kind}/${id}/connections/page`,
    process.env.API_BASE_URL || 'http://127.0.0.1:3001');
  url.searchParams.set('year', year);
  url.searchParams.set('offset', String(position));
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Connection page temporarily unavailable');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('data' in payload)) throw new Error('Bad connection page');
  const data = (payload as { data: Paginated }).data;
  if (!data || !Array.isArray(data.neighbors) ||
      data.year !== Number(year) || data.offset !== position ||
      data.focus?.entity_id !== id || !Number.isSafeInteger(data.total) ||
      data.limit !== 25 || (data.next_offset !== null && !Number.isSafeInteger(data.next_offset)) ||
      data.neighbors.length > 25 ||
      data.neighbors.some(n => !validId(n.entity_id) || typeof n.name !== 'string' ||
        ![n.races,n.result_entries,n.winning_races].every(x => Number.isSafeInteger(x) && x >= 0)))
    throw new Error('Bad connection page');
  const uk = locale === 'uk';
  const base = `/${locale}/explorer/connections/${kind}/${id}?year=${year}&offset=`;
  const graphUrl = `/${locale}/explorer/${kind}/${id}?year=${year}`;
  const from = kind === 'constructors' ? 'constructor' : 'driver';
  return <main className="page">
    <p className="eyebrow">Explorer / {uk ? 'Всі зв’язки сезону' : 'All season connections'}</p>
    <h1>{data.focus.name} · {year}</h1>
    <p className="lead">{uk
      ? 'Повний список спостережуваних зв’язків із записів результатів, сторінками по 25.'
      : 'Browse all observed result-record associations, 25 per page.'}</p>
    <p role="status">{uk ? 'Записи' : 'Records'}: {data.total === 0 ? 0 : position + 1}–{Math.min(position + data.neighbors.length, data.total)} / {data.total}</p>
    {data.neighbors.length === 0
      ? <p>{uk ? 'На цій сторінці немає записів.' : 'No records on this page.'}</p>
      : <ol start={position+1}>{data.neighbors.map(n => {
        const driverId = kind === 'constructors' ? n.entity_id : id;
        const constructorId = kind === 'constructors' ? id : n.entity_id;
        const evidence = `/${locale}/explorer/evidence/${driverId}/${constructorId}?year=${year}&from=${from}&selected=${n.entity_id}`;
        return <li key={n.entity_id}>
          <strong>{n.name}</strong> — {n.races} {uk ? 'гонок' : 'races'},
          {' '}{n.result_entries} {uk ? 'записів' : 'result entries'}.
          {' '}<a href={evidence}>{uk ? 'Переглянути гонки →' : 'View race evidence →'}</a>
          {' '}<a href={`/${locale}/${data.neighbor_type === 'driver' ? 'drivers' : 'constructors'}/${n.entity_id}`}>{uk ? 'Профіль' : 'Profile'}</a>
        </li>;
      })}</ol>}
    <nav aria-label={uk ? 'Сторінки зв’язків' : 'Connection pages'}>
      {position > 0 && <a href={base + Math.max(0,position-25)}>← {uk ? 'Назад' : 'Previous'}</a>}
      {' '}
      {data.next_offset !== null && <a href={base + data.next_offset}>{uk ? 'Наступні 25 →' : 'Next 25 →'}</a>}
    </nav>
    <p><small>{uk
      ? 'Зв’язки базуються на імпортованих результатах; це не підтвердження контрактів чи офіційних стартів.'
      : 'Imported result associations do not establish contracts or official starts.'}</small></p>
    <p><a href={graphUrl}>← {uk ? 'Повернутися до графа' : 'Back to graph'}</a></p>
  </main>;
}
