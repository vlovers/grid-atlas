import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Subject = {
  name: string;
  f1db_external_id: string | null;
  identity_status: string;
  publication: string;
  human_review: string;
};
type Manifest = { publication_status: string; subjects: Subject[] };
type Props = { params: Promise<{ locale: string; slug: string }> };

const root = join(process.cwd(), '..', '..', 'docs', 'editorial', 'constructors', 'batch-01-founders');

function enabled() {
  return process.env.NODE_ENV === 'development' &&
    process.env.GRID_ATLAS_LOCAL_CONSTRUCTOR_PREVIEW === '1';
}

function section(text: string, subject: string): string | null {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => line === `## ${subject}` || line === `### ${subject}` || line.startsWith(`## ${subject} —`) || line.startsWith(`### ${subject} —`));
  if (start < 0) return null;
  const headingLevel = lines[start].match(/^#+/)?.[0].length ?? 2;
  const end = lines.findIndex((line, i) => i > start && /^#{2,3} /.test(line) &&
    (line.match(/^#+/)?.[0].length ?? 4) <= headingLevel);
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

function localeText(part: string, locale: 'uk' | 'en'): string {
  const startMark = locale === 'en' ? /^### English[^\n]*$|^\*\*EN — research draft\.\*\*/m
    : /^### Українська[^\n]*$|^\*\*UK — редакційний чернетковий текст\.\*\*/m;
  const otherMark = locale === 'en' ? /^### Українська|^\*\*UK — редакційний чернетковий текст/m
    : /^### English|^\*\*EN — research draft/m;
  const match = startMark.exec(part);
  if (!match) return '';
  const body = part.slice(match.index + match[0].length);
  const next = otherMark.exec(body);
  const limited = next ? body.slice(0, next.index) : body;
  // Research citations and reviewer instructions are not narrative paragraphs.
  const evidenceBoundary = /^(?:\*\*(?:Research locators?|Review sources?|Review locator|Source inspection queue):|\*\*Source inspection queue:|\*\*Pending:|## (?:Package ledger|Updated progress snapshot))/m.exec(limited);
  const narrative = evidenceBoundary ? limited.slice(0, evidenceBoundary.index) : limited;
  return narrative.trim();
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Unpublished constructor research', robots: { index: false, follow: false } };
}

export default async function LocalConstructorResearch({ params }: Props) {
  if (!enabled()) notFound();
  const { locale, slug } = await params;
  if (locale !== 'en' && locale !== 'uk') notFound();
  if (!/^[a-z0-9-]{1,70}$/.test(slug)) notFound();
  let manifest: Manifest;
  let documents: string[];
  try {
    manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as Manifest;
    documents = await Promise.all([
      'RESEARCH_DRAFTS.md', 'ENGINEERING_ERAS_EXPANSION.md', 'COMPETITIVE_ERAS_EXPANSION.md',
    ].map(name => readFile(join(root, name), 'utf8')));
  } catch {
    notFound();
  }
  if (manifest.publication_status !== 'research_only') notFound();
  const subject = manifest.subjects.find(item => item.name.toLowerCase().replace(/\s+/g, '-') === slug);
  if (!subject || subject.publication !== 'blocked' || subject.human_review !== 'pending') notFound();
  const passages = documents.map(doc => section(doc, subject.name)).filter((item): item is string => item !== null);
  const text = passages.map(item => localeText(item, locale)).filter(Boolean);
  if (text.length === 0) notFound();
  const isUk = locale === 'uk';
  return (
    <main style={{ maxWidth: '75ch', margin: '2rem auto', padding: '1rem', lineHeight: 1.65 }}>
      <p style={{ fontWeight: 700, color: 'crimson' }} role="status">
        {isUk ? 'ЛОКАЛЬНА ЧЕРНЕТКА — НЕ ОПУБЛІКОВАНО, ФАКТИ НЕ ЗАТВЕРДЖЕНО' :
          'LOCAL RESEARCH DRAFT — NOT PUBLISHED OR FACT-APPROVED'}
      </p>
      <h1>{subject.name}</h1>
      <p>{isUk ? 'F1DB ідентифікатор' : 'F1DB identity'}: {subject.f1db_external_id ?? 'pending'} · {subject.identity_status}</p>
      <p>{isUk ? 'Редакторська перевірка очікується' : 'Independent editorial review pending'}</p>
      {text.map((passage, index) => (
        <section key={index} aria-label={isUk ? 'Дослідницький текст' : 'Research manuscript'}>
          {passage.split(/\n\s*\n/).filter(Boolean).map((paragraph, i) =>
            <p key={i} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{paragraph}</p>)}
        </section>
      ))}
    </main>
  );
}
