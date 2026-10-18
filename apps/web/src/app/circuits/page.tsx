import type { Metadata } from 'next';
import Catalogue from '@/components/catalogue';
import type { CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Трассы' };
export default function Circuits({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return <Catalogue path="/circuits" title="Трассы" description="Трассы чемпионата мира и Гран-при, которые проходили на них. История отдельных конфигураций пока не представлена." searchParams={searchParams} />;
}
