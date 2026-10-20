import Link from 'next/link';
import type { ApprovedStory } from './story-contract';
import { validatePublishedStory } from './story-contract';
import styles from './story-reader.module.css';

/** Render ONLY already-published revisions returned by a publication-gated API.
 * No research draft, hardcoded Senna narrative or preview bypass belongs in this component.
 */
export default function StoryReader({ story }: { story: ApprovedStory }) {
  const published = validatePublishedStory(story);
  const sources = new Map(published.sources.map(source => [source.id, source]));
  const uk = published.locale === 'uk';
  return <article className={styles.reader}>
    <header className={styles.hero}>
      <p className={styles.overline}>{uk ? 'ІСТОРІЯ / GRID ATLAS' : 'STORY / GRID ATLAS'}</p>
      <h1>{published.title}</h1>
      <p className={styles.intro}>{published.introduction}</p>
    </header>
    <div className={styles.layout}>
      <nav aria-label={uk ? 'Розділи історії' : 'Story chapters'} className={styles.chapters}>
        <p>{uk ? 'ЗМІСТ' : 'CONTENTS'}</p>
        <ol>{published.chapters.map((chapter, index) => <li key={chapter.id}>
          <a href={'#chapter-' + chapter.id}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{chapter.heading}</a>
        </li>)}</ol>
      </nav>
      <div className={styles.body}>{published.chapters.map((chapter, index) => <section key={chapter.id} id={'chapter-' + chapter.id} className={styles.section} tabIndex={-1}>
        <span className={styles.counter}>{String(index + 1).padStart(2, '0')}</span>
        <h2>{chapter.heading}</h2>
        {chapter.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {chapter.citations.length > 0 && <details className={styles.evidence}>
          <summary>{uk ? 'Джерела та підтвердження' : 'Sources and evidence'} ({chapter.citations.length})</summary>
          <ul>{chapter.citations.map(id => { const source = sources.get(id)!;return <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · {source.publisher}<small>{source.locator}</small></li>;})}</ul>
        </details>}
        {chapter.links.length > 0 && <div className={styles.jumps} aria-label={uk ? 'Дослідити далі' : 'Explore further'}>
          {chapter.links.map(link => <Link href={link.href} key={link.href}>{link.label} <span aria-hidden="true">↗</span></Link>)}
        </div>}
      </section>)}</div>
    </div>
  </article>;
}
