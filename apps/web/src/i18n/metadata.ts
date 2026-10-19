import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { catalogueParams, pageHref, type CatalogueParams } from '@/lib/catalogue';
import { routeMetadata } from '@/lib/seo';
import { getData } from '@/lib/api';
import { PAGE_SIZE } from '@/lib/catalogue';

const pages = {
  driversTitle: ['/drivers', 'driversLead'], constructorsTitle: ['/constructors', 'constructorsLead'],
  circuitsTitle: ['/circuits', 'circuitsLead'], seasonsTitle: ['/seasons', 'seasonsLead'],
  lineageTitle: ['/lineage', 'lineageLead'], sourcesTitle: ['/sources', 'sourcesLead'],
} as const;

export async function localizedMetadata(title: keyof typeof pages, searchParams?: Promise<CatalogueParams>): Promise<Metadata> {
  const t = await getTranslations('UI');
  const locale = await getLocale();
  const { page, offset, q } = catalogueParams(await searchParams ?? {});
  const [path, description] = pages[title];
  const suffix = page > 1 ? ` · ${locale === 'uk' ? 'Сторінка' : 'Page'} ${page}` : '';
  const emptyPage = page > 1 && !q && !(await getData(`/api${path}?${new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), q })}`)).length;
  return { ...routeMetadata(locale, pageHref(path, page), Boolean(q) || emptyPage), title: `${t(title)}${suffix}`, description: `${t(description)}${suffix}` };
}
