import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getExplorerGraph } from '@/lib/explorer-api';
import ExplorerGraph from '@/components/explorer-graph';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ year?: string | string[]; selected?: string | string[] }>;
};
const validId = (value: string) => /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n;
const validYear = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9]{4}$/.test(value) &&
  Number(value) >= 1950 && Number(value) <= 2200;

export default async function ExplorerDriverPage({ params, searchParams }: Props) {
  const { id, locale } = await params;
  if (!validId(id) || !['en', 'uk'].includes(locale)) notFound();
  const query = await searchParams;
  const requested = query.year;
  const selected = typeof query.selected === 'string' && /^[1-9][0-9]{0,18}$/.test(query.selected)
    ? query.selected : undefined;
  const uk = locale === 'uk';
  const selectedYear = validYear(requested) ? Number(requested) : null;
  const graph = selectedYear === null ? null : await getExplorerGraph(id, selectedYear);
  const focus = graph?.nodes.find(node => node.key === graph.focus);

  return <main className="page">
    <p className="eyebrow">{uk ? 'Історія Формули-1' : 'Formula 1 history'} / Explorer</p>
    <h1>{focus?.name ?? (uk ? 'Зв’язки пілота' : 'Driver connections')}</h1>
    <p className="lead">{uk
      ? 'Зв’язки з конструкторами, підтверджені записами результатів вибраного сезону.'
      : 'Constructor connections documented by recorded results for a selected season.'}</p>
    <form method="get">
      <label htmlFor="explorer-year">{uk ? 'Сезон' : 'Season'}</label>{' '}
      <input id="explorer-year" name="year" type="number" min="1950" max="2200"
        step="1" defaultValue={selectedYear ?? ''} required />{' '}
      <button type="submit">{uk ? 'Показати' : 'Explore'}</button>
    </form>
    {requested !== undefined && selectedYear === null &&
      <p role="alert">{uk ? 'Вкажіть рік від 1950 до 2200.' : 'Choose a year from 1950 to 2200.'}</p>}
    {graph && <>
      <p>{uk ? 'Сезон' : 'Season'}: <strong>{graph.year}</strong>.{' '}
        <Link href={`/drivers/${id}`}>{uk ? 'Повернутися до пілота' : 'Back to driver'}</Link>
      </p>
      {graph.edges.length > 0
        ? <ExplorerGraph graph={graph} locale={uk ? 'uk' : 'en'} selectedId={selected} />
        : <p>{uk ? 'У цьому сезоні немає записаних результатів для пілота.' : 'No recorded results for this driver in this season.'}</p>}
      {graph.truncated && <p role="status">{uk
        ? `Показано лише перші ${graph.limit} конструкторів.`
        : `Showing only the first ${graph.limit} constructors.`}</p>}
      <p>{uk
        ? 'Це зв’язки за даними результатів, а не підтвердження стартів, контрактів або правонаступництва команд.'
        : 'These are result-record associations, not proof of starts, contracts or team succession.'}</p>
      <p><small>{uk ? 'Джерело обліку пілота' : 'Driver identity source'}:{' '}
        <a href={graph.source.homepage_url} rel="noopener noreferrer" target="_blank">
          {graph.source.attribution}</a>.{' '}
        {uk ? 'Не є підтвердженням кожного окремого результату.' : 'Not per-result provenance.'}
      </small></p>
    </>}
    <p><Link className="back" href={`/drivers/${id}`}>← {uk ? 'До профілю пілота' : 'Driver profile'}</Link></p>
  </main>;
}
