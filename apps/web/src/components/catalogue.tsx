import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { atlasCopy } from '@/components/atlas/copy';
import styles from './atlas/catalogue.module.css';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { getData, type Driver } from '@/lib/api';
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
  const cataloguePath = getPathname({ locale, href: path });
  const { page, offset, q } = catalogueParams(await searchParams);
  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), q });
  const records = await getData<Driver>(`/api${path}?${query}`);
  query.set('limit', '1');
  query.set('offset', String(offset + PAGE_SIZE));
  const next = records.length === PAGE_SIZE && offset + PAGE_SIZE <= MAX_OFFSET
    && (await getData<Driver>(`/api${path}?${query}`)).length > 0;
  return <section className={`page ${driverIndex ? styles.catalogue : ''}`} data-testid={driverIndex ? 'driver-catalogue' : undefined}>
    {driverIndex ? <header className={styles.heading}><div><p className="eyebrow">{copy.index} / GRID ATLAS</p><h1>{title}</h1></div><p className="lead">{copy.indexLead}</p></header>
      : <StoryHeader title={title} eyebrow={path === '/circuits' ? storyCopy[locale as 'uk' | 'en'].circuits : storyCopy[locale as 'uk' | 'en'].constructorHeader} locale={locale as 'uk' | 'en'} kind={path === '/circuits' ? 'apex' : 'velocity'} lead={description} />}
    <form className={`catalogue-search ${driverIndex ? styles.search : ''}`} action={cataloguePath} role="search">
      <label htmlFor="catalogue-query">{t('searchLabel')}</label>
      <div className="actions"><input id="catalogue-query" name="q" type="search" defaultValue={q} maxLength={100} placeholder={t('searchPlaceholder')} />
        <button className="primary" type="submit">{t('search')}</button>
        {q && <a className="secondary" href={cataloguePath}>{t('resetSearch')}</a>}
      </div>
      {driverIndex && <p className={styles.searchTip}>{copy.searchTip}</p>}
    </form>
    <p role="status" className={driverIndex ? styles.status : undefined}>{t('catalogueStatus', { page, count: records.length })}{q ? ` · ${t('queryStatus', { query: q })}` : ''}</p>
    {driverIndex && records.length > 0 && <div className={styles.indexMeta}><p><strong>{records.length}</strong> {copy.shown}</p><p>{copy.range}: {offset + 1}—{offset + records.length} / {next ? copy.more : copy.final}</p></div>}
    {records.length ? <div className={`driver-grid ${driverIndex ? styles.index : ''}`}>{records.map((record, index) =>
      <a className="driver" href={getPathname({ locale, href: `${path}/${record.id}` })} key={record.id}>{driverIndex && <span className={styles.ordinal} aria-hidden="true">{String(offset + index + 1).padStart(3, '0')}</span>}<div><span className="index">{record.external_id}</span><h2>{record.name}</h2></div>{driverIndex && <span className={styles.arrow} aria-hidden="true">↗</span>}</a>
    )}</div> : <div className={driverIndex ? styles.empty : undefined}><span aria-hidden="true">∅</span><p>{q ? t('noMatches') : t('noRecords')}</p></div>}
    <nav className="actions" aria-label={t('cataloguePages')}>
      {page > 1 && <a className="secondary" href={getPathname({ locale, href: pageHref(path, page - 1, q) })}>← {t('previous')}</a>}
      {next && <a className="secondary" href={getPathname({ locale, href: pageHref(path, page + 1, q) })}>{t('next')} →</a>}
    </nav>
  </section>;
}
