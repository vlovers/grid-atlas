import Link from 'next/link';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
const drivers = [
  ['juan-manuel-fangio', 'Juan Manuel Fangio'], ['jim-clark', 'Jim Clark'], ['graham-hill', 'Graham Hill'],
  ['jack-brabham', 'Jack Brabham'], ['jackie-stewart', 'Jackie Stewart'], ['emerson-fittipaldi', 'Emerson Fittipaldi'],
  ['niki-lauda', 'Niki Lauda'], ['nigel-mansell', 'Nigel Mansell'], ['mika-hakkinen', 'Mika Häkkinen'], ['sebastian-vettel', 'Sebastian Vettel']
] as const;
export default async function BiographyPreviewIndex({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.GRID_ATLAS_LOCAL_EDITORIAL_PREVIEW !== '1' || process.env.NODE_ENV !== 'development') notFound();
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'uk') notFound();
  const isUk = locale === 'uk';
  return <main style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.75 }}>
    <p role="status" style={{ border: '1px solid currentColor', padding: '0.75rem 1rem' }}>{isUk ? 'ЛОКАЛЬНІ ЧЕРНЕТКИ — НЕ ОПУБЛІКОВАНО' : 'LOCAL DRAFTS — NOT PUBLISHED'}</p>
    <h1>{isUk ? '10 біографій для редакційного перегляду' : '10 biographies for editorial review'}</h1>
    <p>{isUk ? 'Кожна біографія доступна українською та англійською. Посилання на джерела наведено під абзацами.' : 'Each biography is available in Ukrainian and English. Expand the source references under each paragraph.'}</p>
    <ol>{drivers.map(([id, name]) => <li key={id}><Link href={`/${locale}/editorial-preview/drivers/${id}`}>{name}</Link></li>)}</ol>
    <p><Link href={`/${isUk ? 'en' : 'uk'}/editorial-preview/drivers`}>{isUk ? 'Switch to English' : 'Перейти українською'}</Link></p>
  </main>;
}
