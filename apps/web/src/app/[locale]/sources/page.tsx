import { getTranslations } from 'next-intl/server';
import { getData } from '@/lib/api';
import { localizedMetadata } from '@/i18n/metadata';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('sourcesTitle');
type Source = { slug: string; homepage_url: string; attribution: string; release_tag: string; artifact_name: string; sha256: string };
export default async function Sources() {
  const t = await getTranslations('UI');
  const sources = await getData<Source>('/api/sources');
  return <section className="page"><p className="eyebrow">GRID ATLAS / {t('source')}</p><h1>{t('sourcesTitle')}</h1><p className="lead">{t('sourcesLead')}</p>
    {sources.length ? sources.map(source => <article className="source-card" key={`${source.slug}-${source.release_tag}-${source.artifact_name}`}>
      <h2><a href={source.homepage_url} target="_blank" rel="noopener noreferrer">{source.slug.toUpperCase()} ↗</a> · {source.release_tag}</h2>
      <p>{source.attribution}</p><p>{t('artifact', { name: source.artifact_name })}</p><p className="checksum">SHA-256: <code>{source.sha256}</code></p>
    </article>) : <p>{t('noSources')}</p>}
    <h2>{t('readingArchive')}</h2><p>{t('sourceLimitations')}</p><p>{t('sourceIdentities')}</p>
    <p>{t.rich('sourceLicense', { license: chunks => <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{chunks}</a> })}</p>
  </section>;
}
