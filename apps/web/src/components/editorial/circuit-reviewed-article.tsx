import type { PublishedArticle } from '../stories/published-article';
import { circuitArticleSections } from './circuit-reviewed-article-model';
import styles from './circuit-reviewed-article.module.css';

type Props = { article: PublishedArticle; locale: 'uk' | 'en' };

/** Server-only projection of an already published API response. No draft import. */
export function CircuitReviewedArticle({ article, locale }: Props) {
  const uk = locale === 'uk';
  const sections = circuitArticleSections(article);
  return <section id="circuit-reviewed-article" className={styles.article} tabIndex={-1}
    aria-labelledby="circuit-reviewed-heading" data-testid="circuit-reviewed-article">
    <header className={styles.header}>
      <p className={styles.eyebrow}>{uk ? 'РЕДАКЦІЙНА СТАТТЯ' : 'EDITORIAL ARTICLE'}</p>
      <h2 id="circuit-reviewed-heading">{article.title}</h2>
      <p>{uk ? 'Кожне твердження має посилання на джерело. Дані перегонів наведені окремо.' :
        'Each claim links to its supporting source. Race results are presented separately.'}</p>
    </header>
    {sections.map((section, index) => <section key={index} className={styles.section}
      aria-label={section.heading || (uk ? 'Розділ статті' : 'Article section')}>
      {section.heading && <h3>{section.heading}</h3>}
      {section.claims.map(claim => <div key={claim.id} className={styles.claim}>
        <p>{claim.statement}</p>
        <ul className={styles.evidence} aria-label={uk ? 'Джерела твердження' : 'Claim sources'}>
          {claim.evidence.map((source, sourceIndex) => <li key={`${source.url}:${source.locator}:${sourceIndex}`}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.title}</a><span> · {source.publisher} · {source.locator}</span>
          </li>)}
        </ul>
      </div>)}
    </section>)}
  </section>;
}
