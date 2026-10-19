import { entitySeo } from '@/lib/entity-seo';
import SeoBreadcrumbs from '@/components/seo-breadcrumbs';

type Props = { children: React.ReactNode; params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params;
  return (await entitySeo('drivers', id, locale)).metadata;
}

export default async function EntityLayout({ children, params }: Props) {
  const { locale, id } = await params;
  const { crumbs, description } = await entitySeo('drivers', id, locale);
  return <><SeoBreadcrumbs locale={locale} crumbs={crumbs} description={description} />{children}</>;
}
