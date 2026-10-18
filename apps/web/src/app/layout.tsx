import type { Metadata } from 'next';
import Link from 'next/link';
import './styles.css';
export const metadata: Metadata = { title: { default: 'GRID ATLAS — Formula 1 history', template: '%s | GRID ATLAS' }, description: 'A source-attributed atlas of Formula 1 history since 1950.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="ru"><body><header className="topbar"><Link href="/" className="logo">GRID<span>ATLAS</span></Link><nav aria-label="Главная навигация"><Link href="/seasons">Сезоны</Link><Link href="/drivers">Пилоты</Link><Link href="/constructors">Конструкторы</Link></nav></header><main id="content">{children}</main><footer>GRID ATLAS · Независимая историческая энциклопедия Формулы-1 · Данные F1DB (CC BY 4.0)</footer></body></html>;
}
