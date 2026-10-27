import { Link } from '@/i18n/navigation';
import { editorialStoryPreviews } from '@/components/stories/editorial-previews';
import { isAiReviewedStory } from '@/components/stories/editorial-publication';
import styles from './season-stories.module.css';

/** Explicit editorial associations, never first/middle/last calendar positions. */
export const seasonStoryYears: Record<string, readonly number[]> = {
  'lauda-hunt-1976': [1976], 'senna-prost-1988-89': [1988, 1989],
  'villeneuve-arnoux-1979': [1979], 'vettel-monza-2008': [2008],
  'button-canada-2011': [2011], 'perez-sakhir-2020': [2020],
  'kubica-bmw-2008': [2008], 'schumacher-ferrari-1996-2000': [1996, 1997, 1998, 1999, 2000],
  'massa-2008': [2008], 'brawn-2009': [2009],
};

export function SeasonStories({ year, locale }: { year: number; locale: 'uk' | 'en' }) {
  const stories = editorialStoryPreviews.filter(story => seasonStoryYears[story.slug]?.includes(year) && isAiReviewedStory(story.slug));
  if (!stories.length) return null;
  return <section aria-labelledby="season-stories-title" data-testid="season-stories">
    <h2 id="season-stories-title">{locale === 'uk' ? 'Історії цього сезону' : 'Stories from this season'}</h2>
    <div className={styles.grid}>{stories.map(story => <article key={story.slug}>
      <p className={styles.year}>{story.year}</p><h3><Link href={`/stories/moments/${story.slug}`}>{story[locale].title}</Link></h3>
      <p>{story[locale].summary}</p><Link className={styles.action} href={`/stories/moments/${story.slug}`}>{locale === 'uk' ? 'Читати історію' : 'Read the story'} ↗</Link>
    </article>)}</div>
  </section>;
}
