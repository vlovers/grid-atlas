import type { Metadata } from 'next';
import Catalogue from '@/components/catalogue';
import type { CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Конструкторы' };
export default function Constructors({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return <Catalogue path="/constructors" title="Конструкторы" description="Конструкторы из исторического архива. Название конструктора и участник чемпионата — разные исторические сущности." searchParams={searchParams} />;
}
