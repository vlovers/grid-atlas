import { getPathname } from '@/i18n/navigation';
import { pageStructuredData, serializeJsonLd, siteOrigin, type Crumb } from '@/lib/seo';
import styles from './seo-breadcrumbs.module.css';

export default function SeoBreadcrumbs({ locale, crumbs, description }: { locale: string; crumbs: Crumb[]; description: string }) {
  const origin = siteOrigin();
  return <>
    <nav className={styles.breadcrumbs} aria-label={locale === 'uk' ? 'Навігаційний шлях' : 'Breadcrumbs'}>
      <ol>{crumbs.map((crumb, index) => <li key={crumb.path}>
        {index === crumbs.length - 1 ? <span aria-current="page">{crumb.name}</span>
          : <a href={getPathname({ locale: locale === 'uk' ? 'uk' : 'en', href: crumb.path })}>{crumb.name}</a>}
      </li>)}</ol>
    </nav>
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageStructuredData(origin, locale, crumbs, description)) }} />}
  </>;
}
