import type { Metadata } from 'next';
import Catalogue from '@/components/catalogue';
import type { CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Пилоты' };
export default function Drivers({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return <Catalogue path="/drivers" title="Пилоты" description="Исторический каталог пилотов Формулы-1. Найдите гонщика и исследуйте его результаты и команды по сезонам." searchParams={searchParams} />;
}
