import batch from '../../../../../../../../../docs/media/batch-290.json';
import candidates from '../../../../../../../../../docs/media/candidates.json';
import staging from '../../../../../../../../../docs/media/cross-era-staging.json';
import additions from '../../../../../../../../../docs/media/batch-290-new-candidates.json';
import { ReviewWorkbench, type ReviewRow } from '../../../review-workbench';

export default async function BatchPreview({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === 'uk' ? 'uk' : 'en';
  const registries: Record<string, { id: string; subject: ReviewRow['subject'] }[]> = { 'docs/media/candidates.json': candidates.assets, 'docs/media/cross-era-staging.json': staging.entries, 'docs/media/batch-290-new-candidates.json': additions.assets };
  const available: string[] = JSON.parse(process.env.MEDIA_REVIEW_AVAILABLE_IDS || '[]');
  const rows: ReviewRow[] = batch.entries.map(task => {
    const candidate = registries[task.registry].find(row => row.id === task.candidate_id);
    if (!candidate) throw Error('Unknown candidate reference');
    return { task, subject: candidate.subject, originalAvailable: available.includes(candidate.id) };
  });
  return <main><nav className="preview-nav"><a href={`/${locale === 'uk' ? 'en' : 'uk'}/batch`}>{locale === 'uk' ? 'English' : 'Українська'}</a><a href={`/${locale}`}>{locale === 'uk' ? 'Компоненти' : 'Components'}</a></nav><ReviewWorkbench rows={rows} locale={locale} /></main>;
}
