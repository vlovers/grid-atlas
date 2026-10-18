import Link from 'next/link';
import type { Metadata } from 'next';
import { getData, type Driver } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Пилоты' };

const PAGE_SIZE = 100;
const MAX_OFFSET = 100000;

export default async function Drivers({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { page: rawPage } = await searchParams;
  const pageValue = typeof rawPage === 'string' ? rawPage : '1';
  const requestedPage = /^[1-9][0-9]*$/.test(pageValue) ? Number(pageValue) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage <= MAX_OFFSET / PAGE_SIZE + 1
    ? requestedPage : 1;
  const offset = (page - 1) * PAGE_SIZE;
  // Fetch one extra row to determine whether a next page exists, without adding a count endpoint.
  // The API caps limit at 100, so probe the following row with a second request only for full pages.
  const drivers = await getData<Driver>(`/api/drivers?limit=${PAGE_SIZE}&offset=${offset}`);
  const hasNext = drivers.length === PAGE_SIZE && offset + PAGE_SIZE <= MAX_OFFSET
    ? (await getData<Driver>(`/api/drivers?limit=1&offset=${offset + PAGE_SIZE}`)).length > 0
    : false;

  return <section className="page">
    <p className="eyebrow">ARCHIVE / DRIVERS</p>
    <h1>Пилоты</h1>
    <p className="lead">Исторический каталог пилотов Формулы-1 в алфавитном порядке. Страница {page}.</p>
    {drivers.length ? <div className="driver-grid">{drivers.map(d =>
      <Link className="driver" key={d.id} href={`/drivers/${d.id}`}><span className="index">{d.external_id}</span><h2>{d.name}</h2></Link>
    )}</div> : <p>На этой странице пилотов нет.</p>}
    <nav className="actions" aria-label="Страницы каталога пилотов">
      {page > 1 && <Link className="secondary" href={page === 2 ? '/drivers' : `/drivers?page=${page - 1}`}>← Предыдущая</Link>}
      {hasNext && <Link className="secondary" href={`/drivers?page=${page + 1}`}>Следующая →</Link>}
    </nav>
  </section>;
}
