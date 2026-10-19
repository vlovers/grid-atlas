import { notFound } from 'next/navigation';
import { getSeasonComparison, validId, validYear, type ComparedNeighbor, type FocusKind } from '@/lib/time-machine';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
type Props = {
  params: Promise<{ locale: string; kind: string; id: string }>;
  searchParams: Promise<{ fromYear?: string | string[]; toYear?: string | string[] }>;
};

export default async function TimeMachinePage({ params, searchParams }: Props) {
  const { locale, kind: rawKind, id } = await params;
  if (!['uk', 'en'].includes(locale) || !['drivers', 'constructors'].includes(rawKind) || !validId(id)) notFound();
  const kind: FocusKind = rawKind === 'drivers' ? 'driver' : 'constructor';
  const uk = locale === 'uk';
  const query = await searchParams;
  const fromValid = validYear(query.fromYear);
  const toValid = validYear(query.toYear);
  const requested = query.fromYear !== undefined || query.toYear !== undefined;
  const same = fromValid && toValid && query.fromYear === query.toYear;
  const valid = fromValid && toValid && !same;
  const comparison = valid ? await getSeasonComparison(kind, id,
    Number(query.fromYear), Number(query.toYear)) : null;

  const renderGroup = (title: string, rows: ComparedNeighbor[], status: 'added' | 'removed' | 'unchanged') =>
    <section className={styles.group} aria-label={title}>
      <h2>{title} ({rows.length})</h2>
      {rows.length === 0
        ? <p>{uk ? 'Немає записаних зв’язків у цій категорії.' : 'No recorded associations in this category.'}</p>
        : <ul>{rows.map(item => <li key={item.entity_id}>
          <strong>{item.name}</strong>
          <span>{status === 'added' ? (uk ? 'Новий запис у порівнюваному сезоні' : 'Recorded in second season only') :
            status === 'removed' ? (uk ? 'Лише в першому сезоні' : 'Recorded in first season only') :
            (uk ? 'Записи в обох сезонах' : 'Records in both seasons')}</span>
          <div className={styles.periods}>
            <div>{query.fromYear}: {item.from
              ? `${item.from.races} ${uk ? 'гонок' : 'races'} · ${item.from.result_entries} ${uk ? 'записів' : 'entries'}`
              : (uk ? 'Немає записів' : 'No imported records')}</div>
            <div>{query.toYear}: {item.to
              ? `${item.to.races} ${uk ? 'гонок' : 'races'} · ${item.to.result_entries} ${uk ? 'записів' : 'entries'}`
              : (uk ? 'Немає записів' : 'No imported records')}</div>
          </div>
          <div className={styles.links}>
            {item.from && <a href={`/${locale}/explorer/${rawKind}/${id}?year=${query.fromYear}&selected=${item.entity_id}`}>
              {uk ? `Граф ${query.fromYear} ↗` : `Graph ${query.fromYear} ↗`}</a>}
            {item.to && <a href={`/${locale}/explorer/${rawKind}/${id}?year=${query.toYear}&selected=${item.entity_id}`}>
              {uk ? `Граф ${query.toYear} ↗` : `Graph ${query.toYear} ↗`}</a>}
          </div>
        </li>)}</ul>}
    </section>;

  return <main className={styles.page}>
    <p className="eyebrow">GRID ATLAS / Explorer / Time Machine</p>
    <h1>{uk ? 'Машина часу' : 'Time Machine'}{comparison ? ` · ${comparison.focus.name}` : ''}</h1>
    <p className="lead">{uk
      ? 'Порівняйте зв’язки за записами результатів у двох сезонах. Це не підтвердження контрактів чи переходів.'
      : 'Compare recorded result associations across two seasons. This does not establish contracts or transfers.'}</p>
    <form method="get" className={styles.form}>
      <label>{uk ? 'Перший сезон' : 'First season'}
        <input name="fromYear" type="number" min="1950" max="2200" required
          defaultValue={fromValid ? query.fromYear as string : '1950'} /></label>
      <label>{uk ? 'Другий сезон' : 'Second season'}
        <input name="toYear" type="number" min="1950" max="2200" required
          defaultValue={toValid ? query.toYear as string : '1951'} /></label>
      <button type="submit">{uk ? 'Порівняти' : 'Compare'}</button>
    </form>
    {requested && !valid && <p role="alert">{uk
      ? 'Виберіть два різні роки від 1950 до 2200.'
      : 'Choose two different years between 1950 and 2200.'}</p>}
    {comparison && <>
      <p className={styles.summary}>{comparison.from_year} → {comparison.to_year} ·{' '}
        {comparison.added.length} {uk ? 'нових' : 'added'} ·{' '}
        {comparison.removed.length} {uk ? 'відсутніх у другому' : 'removed'} ·{' '}
        {comparison.unchanged.length} {uk ? 'в обох сезонах' : 'unchanged'}
      </p>
      {renderGroup(uk ? 'Лише в другому сезоні' : 'Added', comparison.added, 'added')}
      {renderGroup(uk ? 'Лише в першому сезоні' : 'Removed', comparison.removed, 'removed')}
      {renderGroup(uk ? 'В обох сезонах' : 'Unchanged', comparison.unchanged, 'unchanged')}
      <p className={styles.caveat}>{uk
        ? 'Відсутність запису не доводить відсутності участі. Дані — імпортовані результати основних гонок, не офіційні старти, контракти чи правонаступництво команд.'
        : 'Missing imported results do not prove nonparticipation. These are main-race result records, not official starts, contracts or team succession.'}</p>
    </>}
    <p><a href={`/${locale}/${rawKind}/${id}`}>← {uk ? 'До профілю' : 'Back to profile'}</a></p>
  </main>;
}
