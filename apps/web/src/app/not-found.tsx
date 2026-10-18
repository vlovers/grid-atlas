import Link from 'next/link';
export default function NotFound() { return <section className="page"><h1>Страница не найдена</h1><p>Этой записи нет в архиве.</p><Link className="primary" href="/">На главную</Link></section>; }
