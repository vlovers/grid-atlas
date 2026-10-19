import { entitySeo } from '@/lib/entity-seo';
import SeoBreadcrumbs from '@/components/seo-breadcrumbs';

type Props = { children: React.ReactNode; params: Promise<{ locale: string; year: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, year } = await params;
  return (await entitySeo('seasons', year, locale)).metadata;
}

export default async function EntityLayout({ children, params }: Props) {
  const { locale, year } = await params;
  const { crumbs, description } = await entitySeo('seasons', year, locale);
  return <><SeoBreadcrumbs locale={locale} crumbs={crumbs} description={description} />{children}</>;
}
