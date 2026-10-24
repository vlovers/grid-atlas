import { notFound } from 'next/navigation';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
const drivers = ['juan-manuel-fangio', 'jim-clark', 'graham-hill', 'jack-brabham', 'jackie-stewart', 'emerson-fittipaldi', 'niki-lauda', 'nigel-mansell', 'mika-hakkinen', 'sebastian-vettel'] as const;
type Props = { params: Promise<{ locale: string; slug: string }> };
type Dossier = { title: string; publication_status: string; claims: { claim_id: string; statement: string; evidence: { source_id: string; locator: string }[] }[]; sources: { source_id: string; title: string; source_url: string; publisher: string }[] };
export default async function BiographyDraftPreview({ params }: Props) {
  // This route is a local-only research preview; never ship it as a public route.
  if (process.env.GRID_ATLAS_LOCAL_EDITORIAL_PREVIEW !== '1' || process.env.NODE_ENV !== 'development') notFound();
  const { locale, slug } = await params;
  if (locale !== 'en' && locale !== 'uk') notFound();
  if (!drivers.some(id => id === slug)) notFound();
  const filename = path.resolve(process.cwd(), '../../docs/editorial/biography-expansion-batch-2/dossiers', `${slug}.${locale}.json`);
  let dossier: Dossier;
  try { dossier = JSON.parse(await readFile(filename, 'utf8')) as Dossier; } catch { notFound(); }
  if (dossier.publication_status !== 'unpublished') notFound();
  const sources = new Map(dossier.sources.map(s => [s.source_id, s]));
  const isUk = locale === 'uk';
  return <main style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.75 }}>
    <p style={{ padding: '0.75rem 1rem', border: '1px solid currentColor' }} role="status">
      {isUk ? 'ЛОКАЛЬНИЙ РЕДАКЦІЙНИЙ ПЕРЕГЛЯД — НЕ ОПУБЛІКОВАНО, ФАКТИ ПОТРЕБУЮТЬ ПЕРЕВІРКИ' : 'LOCAL EDITORIAL PREVIEW — UNPUBLISHED, FACTS REQUIRE REVIEW'}
    </p>
    <nav aria-label={isUk ? 'Навігація чернетками' : 'Draft navigation'}>
      <Link href={`/${locale}/editorial-preview/drivers`}>{isUk ? '← Усі 10 біографій' : '← All 10 biographies'}</Link>
      {' · '}
      <Link href={`/${locale === 'uk' ? 'en' : 'uk'}/editorial-preview/drivers/${slug}`}>{isUk ? 'English' : 'Українська'}</Link>
    </nav>
    <h1>{dossier.title}</h1>
    {dossier.claims.map(claim => <section key={claim.claim_id} style={{ marginBottom: '1.5rem' }}>
      <p>{claim.statement}</p>
      <details><summary>{isUk ? 'Джерела та фрагменти для перевірки' : 'Sources and review locators'}</summary>
        <ul>{claim.evidence.map((e, i) => { const s = sources.get(e.source_id); return <li key={`${e.source_id}-${i}`}>
          {s ? <a href={s.source_url} target="_blank" rel="noopener noreferrer">{s.publisher}: {s.title}</a> : e.source_id}
          {' — '}{e.locator}
        </li>; })}</ul>
      </details>
    </section>)}
    <footer><p>{isUk ? 'Цей текст не пройшов незалежне редакційне затвердження.' : 'This draft has not passed independent editorial approval.'}</p></footer>
  </main>;
}
