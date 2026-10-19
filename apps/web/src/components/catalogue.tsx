import { getLocale, getTranslations } from 'next-intl/server';
import { getPathname, Link } from '@/i18n/navigation';
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
  const cataloguePath = getPathname({ locale: await getLocale(), href: path });
  const { page, offset, q } = catalogueParams(await searchParams);
  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), q });
  const records = await getData<Driver>(`/api${path}?${query}`);
  query.set('limit', '1');
  query.set('offset', String(offset + PAGE_SIZE));
  const next = records.length === PAGE_SIZE && offset + PAGE_SIZE <= MAX_OFFSET
    && (await getData<Driver>(`/api${path}?${query}`)).length > 0;
  return <section className="page">
    <p className="eyebrow">{t('archive')} / {title}</p><h1>{title}</h1>
    <p className="lead">{description}</p>
    <form className="catalogue-search" action={cataloguePath} role="search">
      <label htmlFor="catalogue-query">{t('searchLabel')}</label>
      <div className="actions"><input id="catalogue-query" name="q" type="search" defaultValue={q} maxLength={100} placeholder={t('searchPlaceholder')} />
        <button className="primary" type="submit">{t('search')}</button>
        {q && <a className="secondary" href={cataloguePath}>{t('resetSearch')}</a>}
      </div>
    </form>
    <p role="status">{t('catalogueStatus', { page, count: records.length })}{q ? ` · ${t('queryStatus', { query: q })}` : ''}</p>
    {records.length ? <div className="driver-grid">{records.map(record =>
      <Link prefetch={false} className="driver" href={`${path}/${record.id}`} key={record.id}><span className="index">{record.external_id}</span><h2>{record.name}</h2></Link>
    )}</div> : <p>{q ? t('noMatches') : t('noRecords')}</p>}
    <nav className="actions" aria-label={t('cataloguePages')}>
      {page > 1 && <Link className="secondary" href={pageHref(path, page - 1, q)}>← {t('previous')}</Link>}
      {next && <Link className="secondary" href={pageHref(path, page + 1, q)}>{t('next')} →</Link>}
    </nav>
  </section>;
}
