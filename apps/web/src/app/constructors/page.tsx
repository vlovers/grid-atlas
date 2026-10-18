import Link from 'next/link';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Конструкторы' };
type Constructor = { id: string; name: string; external_id: string };
export default async function Constructors({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { page: raw } = await searchParams;
  const value = typeof raw === 'string' ? raw : '1';
  const n = /^[1-9][0-9]*$/.test(value) ? Number(value) : 1;
  const page = Number.isSafeInteger(n) && n <= 1001 ? n : 1;
  const offset = (page - 1) * 100;
  const teams = await getData<Constructor>(`/api/constructors?limit=100&offset=${offset}`);
  const next = teams.length === 100 && offset + 100 <= 100000
    && (await getData<Constructor>(`/api/constructors?limit=1&offset=${offset + 100}`)).length > 0;
  return <section className="page"><p className="eyebrow">ARCHIVE / CONSTRUCTORS</p><h1>Конструкторы</h1>
    <p className="lead">Команды-конструкторы из исторического архива. Страница {page}.</p>
    {teams.length ? <div className="driver-grid">{teams.map(t=><Link className="driver" href={`/constructors/${t.id}`} key={t.id}><span className="index">{t.external_id}</span><h2>{t.name}</h2></Link>)}</div> : <p>Записей на этой странице нет.</p>}
    <nav className="actions" aria-label="Страницы конструкторов">
      {page > 1 && <Link className="secondary" href={page === 2 ? '/constructors' : `/constructors?page=${page-1}`}>← Предыдущая</Link>}
      {next && <Link className="secondary" href={`/constructors?page=${page+1}`}>Следующая →</Link>}
    </nav>
  </section>;
}
