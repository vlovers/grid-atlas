import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getData, type CatalogueEntity } from '@/lib/api';
import { localizedMetadata } from '@/i18n/metadata';
import { glossary } from '@/content/glossary';
import discoveryStyles from "@/components/history-atlas/discovery.module.css";
import styles from '@/components/history-atlas/history-atlas.module.css';
import LineageExplorer, { type LineageEdge } from './lineage-explorer';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('lineageTitle');
type Query = Record<string, string | string[] | undefined>;
export default async function LineagePage({ params, searchParams }: { params: Promise<{locale: string}>; searchParams: Promise<Query> }) {
  const { locale } = await params;
  if (locale !== 'uk' && locale !== 'en') notFound();
  const t = await getTranslations('UI');
  const words = glossary[locale];
  const q = await searchParams;
  const query = typeof q.q === 'string' ? q.q.trim().slice(0,100) : '';
  const offset = typeof q.offset === 'string' && /^(0|[1-9][0-9]{0,4})$/.test(q.offset) ? Number(q.offset) : 0;
  const [edges, constructors] = await Promise.all([
    getData<LineageEdge>('/api/lineage/network'),
    getData<CatalogueEntity>(`/api/constructors?${new URLSearchParams({q:query, limit:'13', offset:String(offset)})}`),
  ]);
  const pageHref = (value: number) => `/${locale}/lineage?${new URLSearchParams({q:query,offset:String(value)})}#constructor-discovery`;
  return <section className={`page ${styles.page}`}>
    <header className={styles.hero}><div><p className={styles.kicker}>GRID ATLAS / {t('historicalRelations')}</p><h1>{t('lineageTitle')}</h1><p>{t('lineageLead')}</p></div></header>
    {edges.length === 0 && <aside className={styles.search} data-testid="lineage-reviewed-empty" role="status"><h2>{words.lineageEmpty}</h2><p>{words.lineageEmptyNote}</p></aside>}
    <section id="constructor-discovery" aria-labelledby="constructor-discovery-title" className={styles.search} data-testid="lineage-archive-search">
      <h2 id="constructor-discovery-title">{words.constructorSearch}</h2><p>{words.constructorSearchNote}</p>
      <form method="get"><label>{t('searchLabel')}<input name="q" type="search" defaultValue={query} maxLength={100} placeholder={t('teamPlaceholder')} /></label><button type="submit">{t('search')} ↗</button>{query && <a href={`/${locale}/lineage#constructor-discovery`}>{words.clear}</a>}</form>
      <nav className={styles.paging} aria-label={words.startConstructor}>{['Ferrari','McLaren','Lotus'].map(name => <a key={name} href={`/${locale}/lineage?${new URLSearchParams({q:name})}#constructor-discovery`}>{name} ↗</a>)}</nav>
      {constructors.length ? <ul className={styles.searchResults}>{constructors.slice(0,12).map(entity => <li key={entity.id}><div className={discoveryStyles.partner}><h3>{entity.name}</h3><a href={`/${locale}/constructors/${entity.id}`}>{words.dossier} ↗</a><a href={`/${locale}/atlas?kind=constructor&id=${entity.id}`}>{words.atlas} ↗</a></div></li>)}</ul> : <p role="status">{words.noResults}</p>}
      <nav className={styles.paging} aria-label={t('cataloguePages')}>{offset > 0 && <a href={pageHref(Math.max(0,offset-12))}>← {words.previous}</a>}{constructors.length > 12 && offset <= 99987 && <a href={pageHref(offset+12)}>{words.next} →</a>}</nav>
    </section>
    {edges.length > 0 && <section aria-labelledby="lineage-claims-title"><h2 id="lineage-claims-title">{words.lineageClaims}</h2><LineageExplorer edges={edges} /><p>{t('lineageCap')}</p></section>}
    <nav className={styles.continue} aria-label={t('goldenJourneys')}><a href={`/${locale}/atlas?kind=constructor`}>{words.atlas} ↗</a><a href={`/${locale}/constructors`}>{words.constructors} ↗</a><a href={`/${locale}/drivers`}>{words.drivers} ↗</a></nav>
    <details className={styles.sources}><summary>{words.lineageSources}</summary><p>{t('lineageCap')}</p><p>{t('lineageLead')}</p><a href={`/${locale}/sources`}>{words.sources} ↗</a></details>
  </section>;
}
