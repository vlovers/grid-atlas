import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getConstructorExplorerGraph } from '@/lib/explorer-api';
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

export default async function ConstructorExplorerPage({ params, searchParams }: Props) {
  const { id, locale } = await params;
  if (!validId(id) || !['en', 'uk'].includes(locale)) notFound();
  const query = await searchParams;
  const requested = query.year;
  const selected = typeof query.selected === 'string' && /^[1-9][0-9]{0,18}$/.test(query.selected)
    ? query.selected : undefined;
  const uk = locale === 'uk';
  const selectedYear = validYear(requested) ? Number(requested) : null;
  const graph = selectedYear === null ? null : await getConstructorExplorerGraph(id, selectedYear);
  const focus = graph?.nodes.find(node => node.key === graph.focus);

  return <main className="page">
    <p className="eyebrow">{uk ? 'Історія Формули-1' : 'Formula 1 history'} / Explorer</p>
    <h1>{focus?.name ?? (uk ? 'Зв’язки конструктора' : 'Constructor connections')}</h1>
    <p className="lead">{uk
      ? 'Пілоти, пов’язані з конструктором записами результатів вибраного сезону.'
      : 'Drivers associated with this constructor by recorded results in the selected season.'}</p>
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
        <Link href={`/constructors/${id}`}>{uk ? 'Повернутися до конструктора' : 'Back to constructor'}</Link>
      </p>
      {graph.edges.length > 0
        ? <ExplorerGraph graph={graph} locale={uk ? 'uk' : 'en'} selectedId={selected} />
        : <p>{uk ? 'У цьому сезоні немає записаних результатів для конструктора.' : 'No recorded results for this constructor in this season.'}</p>}
      {graph.truncated && <p role="status">{uk
        ? `Показано лише перших ${graph.limit} пілотів.`
        : `Showing only the first ${graph.limit} drivers.`}{' '}
        <a href={`/${locale}/explorer/connections/constructors/${id}?year=${graph.year}&offset=25`}>
          {uk ? 'Переглянути решту зв’язків →' : 'Browse remaining connections →'}
        </a></p>}
      <p>{uk
        ? 'Це асоціації записів результатів, а не підтвердження офіційних стартів, контрактів або правонаступництва.'
        : 'These are result-record associations, not proof of official starts, contracts or team succession.'}</p>
      <p><small>{uk ? 'Джерело ідентичності конструктора' : 'Constructor identity source'}:{' '}
        <a href={graph.source.homepage_url} rel="noopener noreferrer" target="_blank">
          {graph.source.attribution}</a>.{' '}
        {uk ? 'Не є підтвердженням кожного окремого результату.' : 'Not per-result provenance.'}
      </small></p>
    </>}
    <p><Link className="back" href={`/constructors/${id}`}>← {uk ? 'До профілю конструктора' : 'Constructor profile'}</Link></p>
  </main>;
}
