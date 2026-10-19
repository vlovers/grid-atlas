import { getTranslations } from 'next-intl/server';
import { getData } from '@/lib/api';
import { localizedMetadata } from '@/i18n/metadata';
import LineageExplorer, { type LineageEdge } from './lineage-explorer';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('lineageTitle');
export default async function LineagePage() {
  const t = await getTranslations('UI');
  const edges = await getData<LineageEdge>('/api/lineage/network');
  return <section className="page"><p className="eyebrow">GRID ATLAS / {t('historicalRelations')}</p><h1>{t('lineageTitle')}</h1>
    <p className="lead">{t('lineageLead')}</p><LineageExplorer edges={edges} /><p>{t('lineageCap')}</p>
  </section>;
}
