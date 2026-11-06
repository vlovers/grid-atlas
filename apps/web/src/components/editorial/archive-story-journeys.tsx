import { Link } from '@/i18n/navigation';
import { editorialStoryPreviews } from '@/components/stories/editorial-previews';
import { isAiReviewedStory } from '@/components/stories/editorial-publication';
import styles from './archive-story-journeys.module.css';

type Locale = 'uk' | 'en';
type Kind = 'drivers' | 'constructors';
const journeys = {
  drivers: ['lauda-hunt-1976', 'senna-prost-1988-89', 'villeneuve-arnoux-1979', 'vettel-monza-2008', 'button-canada-2011', 'perez-sakhir-2020', 'kubica-bmw-2008', 'massa-2008'],
  constructors: ['schumacher-ferrari-1996-2000', 'brawn-2009', 'senna-prost-1988-89', 'vettel-monza-2008', 'kubica-bmw-2008', 'perez-sakhir-2020'],
} as const;

export function publishedArchiveJourneys(kind: Kind) {
  return journeys[kind].flatMap(slug => {
    const story = editorialStoryPreviews.find(item => item.slug === slug);
    return story && isAiReviewedStory(slug) ? [story] : [];
  });
}

/** Editorially reviewed links only; never expose draft manuscripts or unapproved routes. */
export function ArchiveStoryJourneys({ kind, locale }: { kind: Kind; locale: Locale }) {
  const stories = publishedArchiveJourneys(kind);
  if (!stories.length) return null;
  const uk = locale === 'uk';
  return <section className={styles.section} aria-labelledby="archive-journeys-title" data-testid="archive-story-journeys">
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>{uk ? 'Історії архіву' : 'From the archive'}</p>
        <h2 id="archive-journeys-title">{uk ? 'За цифрами — історії' : 'Beyond the statistics'}</h2></div>
      <p>{uk ? 'Відкрийте суперництва, несподівані перемоги та поворотні сезони через перевірені історії.' : 'Explore rivalries, unlikely victories and turning-point seasons through reviewed stories.'}</p>
    </div>
    <div className={styles.grid}>{stories.map(story => <article className={styles.story} key={story.slug}>
      <span className={styles.year}>{story.year}</span>
      <h3><Link href={`/stories/moments/${story.slug}`}>{story[locale].title}</Link></h3>
      <p>{story[locale].summary}</p>
      <Link className={styles.read} href={`/stories/moments/${story.slug}`}>{uk ? 'Читати історію' : 'Read the story'} <span aria-hidden="true">↗</span></Link>
    </article>)}</div>
    <Link className={styles.all} href="/stories">{uk ? 'Усі опубліковані історії' : 'All published stories'} <span aria-hidden="true">↗</span></Link>
  </section>;
}
