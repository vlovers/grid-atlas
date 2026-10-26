import { Suspense } from 'react';
import { SectionHeading, SourceAttribution } from '@/components/editorial/primitives';
import { ArchiveFeatures } from '@/components/editorial/archive-features';
import { archiveCopy } from '@/components/editorial/archive-copy';
import { atlasCopy } from '@/components/atlas/copy';
import styles from './atlas/catalogue.module.css';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { getData, type CatalogueEntity } from '@/lib/api';
import { catalogueParams, pageHref, PAGE_SIZE, MAX_OFFSET, type CatalogueParams } from '@/lib/catalogue';

type Props = {
  path: '/drivers' | '/constructors' | '/circuits';
  title: string;
  description: string;
  searchParams: Promise<CatalogueParams>;
};

export default async function Catalogue({ path, title, description, searchParams }: Props) {
  const t = await getTranslations('UI');
  const locale = await getLocale();
  const driverIndex = path === '/drivers';
  const copy = atlasCopy[locale as 'uk' | 'en'];
  const a = archiveCopy[locale as 'uk' | 'en'];
  const kind = path.slice(1) as 'drivers' | 'constructors' | 'circuits';
  const cataloguePath = getPathname({ locale, href: path });
  const { page, offset, q } = catalogueParams(await searchParams);
  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), q });
  const records = await getData<CatalogueEntity>(`/api${path}?${query}`);
  query.set('limit', '1');
  query.set('offset', String(offset + PAGE_SIZE));
  const next = records.length === PAGE_SIZE && offset + PAGE_SIZE <= MAX_OFFSET
    && (await getData<CatalogueEntity>(`/api${path}?${query}`)).length > 0;
  return <section className={`page ${styles.catalogue}`} data-testid={`${kind === 'drivers' ? 'driver' : kind}-catalogue`}>
    <header className={styles.heading} data-testid="editorial-hero"><div><p className="eyebrow">{a.index} / GRID ATLAS</p><h1>{title}</h1></div><p className="lead">{description}</p></header>
    <SourceAttribution locale={locale as 'uk' | 'en'} />
    {page === 1 && !q && records.length > 0 && <Suspense fallback={<p role="status">{a.loading}</p>}><ArchiveFeatures kind={kind} fallback={records} locale={locale as 'uk' | 'en'} /></Suspense>}
    <SectionHeading id="complete-index" kicker={a.index} title={a.archive} />
    <form className={`catalogue-search ${styles.search}`} action={cataloguePath} role="search">
      <label htmlFor="catalogue-query">{t('searchLabel')}</label>
      <div className="actions"><input id="catalogue-query" name="q" type="search" defaultValue={q} maxLength={100} placeholder={t('searchPlaceholder')} />
        <button className="primary" type="submit">{t('search')}</button>
        {q && <a className="secondary" href={cataloguePath}>{t('resetSearch')}</a>}
      </div>
      {driverIndex && <p className={styles.searchTip}>{copy.searchTip}</p>}
    </form>
    <p role="status" className={styles.status}>{t('catalogueStatus', { page, count: records.length })}{q ? ` · ${t('queryStatus', { query: q })}` : ''}</p>
    {driverIndex && records.length > 0 && <div className={styles.indexMeta}><p><strong>{records.length}</strong> {copy.shown}</p><p>{copy.range}: {offset + 1}—{offset + records.length} / {next ? copy.more : copy.final}</p></div>}
    {records.length ? <div className={`driver-grid ${styles.index}`}>{records.map((record, index) =>
      <a className="driver" href={getPathname({ locale, href: `${path}/${record.id}` })} key={record.id}><span className={styles.ordinal} aria-hidden="true">{String(offset + index + 1).padStart(3, '0')}</span><div><h2>{record.name}</h2><p className={styles.period}>{record.first_season == null ? (locale === 'uk' ? 'Немає результатів гонок' : 'No race results') : `${record.first_season}${record.last_season !== record.first_season ? `–${record.last_season}` : ''}`}</p>
        {record.races !== undefined && <dl className={styles.cardStats}><div><dt>{locale === 'uk' ? 'Гонки з результатами' : 'Races with results'}</dt><dd>{record.races}</dd></div>
          {record.wins !== undefined && <div><dt>{locale === 'uk' ? 'Перемоги' : 'Wins'}</dt><dd>{record.wins}</dd></div>}
          {record.titles != null && record.titles > 0 && <div><dt>{locale === 'uk' ? 'Титули' : 'Titles'}</dt><dd>{record.titles}</dd></div>}</dl>}
        <span className={styles.profileAction}>{a.open} ↗</span></div><span className={styles.arrow} aria-hidden="true">↗</span></a>
    )}</div> : <div className={driverIndex ? styles.empty : undefined}><span aria-hidden="true">∅</span><p>{q ? t('noMatches') : t('noRecords')}</p></div>}
    <details className={styles.countNote}><summary>{locale === 'uk' ? 'Про статистику' : 'About these figures'}</summary><p>{locale === 'uk' ? 'Гонки — різні Гран-прі з результатом, зокрема сходи та випадки без старту; це не кількість офіційних стартів. Спільні автомобілі не подвоюють перемоги. Титули наведено лише за підсумковими заліками F1DB; відсутній залік не означає відсутність титулів.' : 'Races count distinct Grands Prix with a result, including retirements and non-starts; these are not official starts. Shared drives do not double wins. Titles use final F1DB standings only; missing standings do not establish an absence of titles.'}</p></details>
    <nav className="actions" aria-label={t('cataloguePages')}>
      {page > 1 && <a className="secondary" href={getPathname({ locale, href: pageHref(path, page - 1, q) })}>← {t('previous')}</a>}
      {next && <a className="secondary" href={getPathname({ locale, href: pageHref(path, page + 1, q) })}>{t('next')} →</a>}
    </nav>
  </section>;
}
