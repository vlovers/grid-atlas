import { getTranslations } from 'next-intl/server';
import Catalogue from '@/components/catalogue';
import type { CatalogueParams } from '@/lib/catalogue';
import { localizedMetadata } from '@/i18n/metadata';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('driversTitle');
export default async function Page({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const t = await getTranslations('UI');
  return <Catalogue path="/drivers" title={t('driversTitle')} description={t('driversLead')} searchParams={searchParams} />;
}
