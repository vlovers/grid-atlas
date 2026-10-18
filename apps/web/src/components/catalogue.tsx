import Link from 'next/link';
import { getData, type Driver } from '@/lib/api';
import { catalogueParams, pageHref, PAGE_SIZE, MAX_OFFSET, type CatalogueParams } from '@/lib/catalogue';

type Props = {
  path: '/drivers' | '/constructors' | '/circuits';
  title: string;
  description: string;
  searchParams: Promise<CatalogueParams>;
};

export default async function Catalogue({ path, title, description, searchParams }: Props) {
  const { page, offset, q } = catalogueParams(await searchParams);
  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), q });
  const records = await getData<Driver>(`/api${path}?${query}`);
  query.set('limit', '1');
  query.set('offset', String(offset + PAGE_SIZE));
  const next = records.length === PAGE_SIZE && offset + PAGE_SIZE <= MAX_OFFSET
    && (await getData<Driver>(`/api${path}?${query}`)).length > 0;
  return <section className="page">
    <p className="eyebrow">ARCHIVE / {path.slice(1).toUpperCase()}</p><h1>{title}</h1>
    <p className="lead">{description}</p>
    <form className="catalogue-search" action={path} role="search">
      <label htmlFor="catalogue-query">Поиск по имени или идентификатору F1DB</label>
      <div className="actions"><input id="catalogue-query" name="q" type="search" defaultValue={q} maxLength={100} placeholder="Введите часть названия" />
        <button className="primary" type="submit">Найти</button>
        {q && <Link className="secondary" href={path}>Сбросить поиск</Link>}
      </div>
    </form>
    <p role="status">Страница {page}{q ? ` · Поиск: «${q}»` : ''} · Записей на странице: {records.length}</p>
    {records.length ? <div className="driver-grid">{records.map(record =>
      <Link className="driver" href={`${path}/${record.id}`} key={record.id}><span className="index">{record.external_id}</span><h2>{record.name}</h2></Link>
    )}</div> : <p>{q ? 'Совпадений нет. Попробуйте другую часть имени или сбросьте поиск.' : 'Записей на этой странице нет.'}</p>}
    <nav className="actions" aria-label="Страницы каталога">
      {page > 1 && <Link className="secondary" href={pageHref(path, page - 1, q)}>← Предыдущая</Link>}
      {next && <Link className="secondary" href={pageHref(path, page + 1, q)}>Следующая →</Link>}
    </nav>
  </section>;
}
