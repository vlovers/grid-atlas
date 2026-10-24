import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Subject = {
  name: string;
  f1db_external_id: string | null;
  identity_status: string;
  human_review: string;
  publication: string;
};
type Manifest = { publication_status: string; subjects: Subject[] };
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Unpublished constructor manuscript index', robots: { index: false, follow: false } };
}

export default async function ConstructorResearchIndex({ params }: Props) {
  if (process.env.NODE_ENV !== 'development' ||
      process.env.GRID_ATLAS_LOCAL_CONSTRUCTOR_PREVIEW !== '1') notFound();
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'uk') notFound();
  let manifest: Manifest;
  try {
    manifest = JSON.parse(await readFile(
      join(process.cwd(), '..', '..', 'docs/editorial/constructors/batch-01-founders/manifest.json'),
      'utf8',
    )) as Manifest;
  } catch {
    notFound();
  }
  if (manifest.publication_status !== 'research_only' ||
      !Array.isArray(manifest.subjects) || manifest.subjects.length !== 12 ||
      manifest.subjects.some(subject => subject.publication !== 'blocked' ||
        subject.human_review !== 'pending')) notFound();
  const uk = locale === 'uk';
  return (
    <main style={{ maxWidth: '70ch', margin: '2rem auto', padding: '1rem', lineHeight: 1.7 }}>
      <p role="status" style={{ color: 'crimson', fontWeight: 700 }}>
        {uk ? 'ЛОКАЛЬНІ ДОСЛІДНИЦЬКІ ЧЕРНЕТКИ — НЕ ОПУБЛІКОВАНО' :
          'LOCAL RESEARCH DRAFTS — NOT PUBLISHED'}
      </p>
      <h1>{uk ? 'Конструктори: редакторський перегляд' : 'Constructor manuscript review'}</h1>
      <p>{uk ? 'Усі тексти потребують перевірки джерел та незалежного схвалення.' :
        'All texts require independent source and editorial approval.'}</p>
      <ul>
        {manifest.subjects.map(subject => (
          <li key={subject.name}>
            <Link href={`/${locale}/editorial/constructors/${subject.name.toLowerCase().replace(/\\s+/g, '-')}`}>
              {subject.name}
            </Link>
            {' — '}{subject.f1db_external_id ?? (uk ? 'ідентифікатор очікується' : 'identity pending')}
            {' · '}{subject.identity_status}
          </li>
        ))}
      </ul>
    </main>
  );
}
