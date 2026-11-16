import { archiveReleaseUrl } from '../../../../model';
export default async function Sources({ params }: { params: Promise<{ locale: string }> }) {
  const uk = (await params).locale === 'uk';
  return <main><h1>{uk ? 'Джерела та межі' : 'Sources and limits'}</h1><p>{uk ? 'Записи F1DB — джерело хронології, не схвалення прав на зображення чи історичних апексів.' : 'F1DB records supply the chronology, not image-rights clearance or authenticated historical apices.'}</p><a href={archiveReleaseUrl}>F1DB v2026.17.0</a><p>CC BY 4.0 · <a href="https://github.com/f1db/f1db/blob/v2026.17.0/LICENSE">LICENSE</a></p><a href={uk ? '/uk' : '/en'}>{uk ? 'До пропозиції' : 'Back to proposal'}</a></main>;
}
