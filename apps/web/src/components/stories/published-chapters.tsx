import type { PublishedArticle } from './published-article';
import styles from './release.module.css';

/** Plain text only: no HTML/Markdown execution. Evidence stays next to its claim. */
export function PublishedChapters({ article, locale }: { article: PublishedArticle; locale: 'en' | 'uk' }) {
  const uk = locale === 'uk';
  return <article className={styles.published} data-testid="published-chapters">
    <header><p className={styles.eyebrow}>{uk ? 'ІСТОРИЧНИЙ ТЕКСТ / ДЖЕРЕЛА' : 'HISTORICAL TEXT / SOURCES'}</p><h3>{article.title}</h3></header>
    {article.sections.map((section, index) => <details key={index} open={index === 0}>
      <summary>{section.heading || (uk ? 'Історичний контекст' : 'Historical context')}</summary>
      {section.claim_ids.map(id => { const claim = article.claims.find(c => c.id === id)!; return <div key={id} className={styles.claim}>
        <p>{claim.statement}</p><details><summary>{uk ? 'Перевірити джерела' : 'Inspect sources'} ({claim.evidence.length})</summary>
          <ul>{claim.evidence.map((e, n) => <li key={n}><a href={e.url} rel="noreferrer">{e.title}</a><span> — {e.publisher}{e.author ? ` · ${e.author}` : ''}</span>
            <p>{e.locator}</p><small>{uk ? 'Переглянуто' : 'Accessed'}: <time dateTime={e.accessed_on}>{e.accessed_on}</time></small></li>)}</ul>
        </details></div>; })}
    </details>)}
    <p className={styles.note}>{uk ? 'Дата публікації' : 'Published'}: <time dateTime={article.published_at}>{article.published_at.slice(0, 10)}</time>. {uk ? 'Текст і мова пройшли окремий редакційний шлюз; статистика архіву нижче має інше походження.' : 'Text and locale passed the separate editorial gate; archive statistics have a different provenance.'}</p>
  </article>;
}
