import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';

export const dynamic = 'force-dynamic';
type Entrant = { id: string; name: string; external_id: string };
type Edge = { id: string; subject_id: string; subject_name: string; object_id: string; object_name: string; relation_type: string; effective_year: number | null; source_url: string; source_title: string; source_publisher: string; evidence_note: string };
type Props = { params: Promise<{ id: string }> };
const valid = (id: string) => /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!valid(id)) return { title: t('entrantMissing') };
  const data = await getData<Entrant>(`/api/entrants/${id}`);
  return { title: data[0] ? `${data[0].name} — ${t('entrant')}` : t('entrantMissing') };
}
export default async function EntrantPage({ params }: Props) {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!valid(id)) notFound();
  const [entities, edges] = await Promise.all([
    getData<Entrant>(`/api/entrants/${id}`),
    getData<Edge>(`/api/entrants/${id}/lineage`),
  ]);
const labels: Record<string,string> = { renamed_to: t('renamed_to'), assets_acquired_by: t('assets_acquired_by'), operations_succeeded_by: t('operations_succeeded_by') };
  const entrant = entities[0];
  if (!entrant) notFound();
  return <section className="page">
    <p className="eyebrow">{t('archive')} / {t('entrant')} · {entrant.external_id}</p>
    <h1>{entrant.name}</h1>
    <p className="lead">{t('entrantLead')}</p>
    <h2>{t('verifiedRelations')}</h2>
    {edges.length ? <div className="lineup-grid">{edges.map(edge => <article className="lineup-team" key={edge.id}>
      <p className="eyebrow">{labels[edge.relation_type] ?? edge.relation_type} · {edge.effective_year ?? t('unknownYear')}</p>
      <h3><Link href={`/entrants/${edge.subject_id}`}>{edge.subject_name}</Link> → <Link href={`/entrants/${edge.object_id}`}>{edge.object_name}</Link></h3>
      <p>{edge.evidence_note}</p>
      <a className="back" href={edge.source_url} target="_blank" rel="noopener noreferrer">{t('source')}: {edge.source_title} · {edge.source_publisher} ↗</a>
    </article>)}</div> : <p>{t('noEntrantRelations')}</p>}
    <Link className="back" href="/constructors">← {t('constructorCatalogue')}</Link>
  </section>;
}
