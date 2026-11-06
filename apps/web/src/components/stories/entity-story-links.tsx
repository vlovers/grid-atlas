import { Link } from '@/i18n/navigation';
import { editorialStoryPreviews } from './editorial-previews';
import { isAiReviewedStory } from './editorial-publication';
import { storyPeopleFor } from './editorial-people';
import styles from './entity-story-links.module.css';

type Kind = 'driver' | 'constructor';
type Locale = 'en' | 'uk';

/** Editorial associations, not claims about contracts, constructor continuity or official starts. */
const constructorStorySlugs: Record<string, readonly string[]> = {
  ferrari: ['schumacher-ferrari-1996-2000', 'massa-2008', 'villeneuve-arnoux-1979'],
  mclaren: ['lauda-hunt-1976', 'senna-prost-1988-89', 'button-canada-2011'],
  'brawn-gp': ['brawn-2009'],
  'bmw-sauber': ['kubica-bmw-2008'],
  'toro-rosso': ['vettel-monza-2008'],
  'racing-point': ['perez-sakhir-2020'],
};

export function storiesForArchiveEntity(kind: Kind, externalId: string) {
  return editorialStoryPreviews.filter(story => {
    if (!isAiReviewedStory(story.slug)) return false;
    return kind === 'driver'
      ? storyPeopleFor(story.slug).some(person => person[0] === externalId)
      : (constructorStorySlugs[externalId] ?? []).includes(story.slug);
  });
}

export function EntityStoryLinks({ kind, externalId, locale }: { kind: Kind; externalId: string; locale: Locale }) {
  const stories = storiesForArchiveEntity(kind, externalId);
  if (!stories.length) return null;
  const uk = locale === 'uk';
  return <section className={styles.section} aria-labelledby="entity-stories-title" data-testid="entity-story-links">
    <div className={styles.intro}>
      <p className={styles.eyebrow}>{uk ? 'Історії архіву' : 'Archive stories'}</p>
      <h2 id="entity-stories-title">{uk ? 'За межами протоколу' : 'Beyond the race results'}</h2>
      <p>{uk ? 'Перевірені редакційні історії, пов’язані з цією сторінкою. Зв’язок тематичний і не підтверджує контрактів чи спадковості команд.' : 'Reviewed editorial stories associated with this profile. These thematic links do not establish contracts or team continuity.'}</p>
    </div>
    <ul className={styles.grid}>{stories.map(story => <li key={story.slug}>
      <span className={styles.year}>{story.year}</span>
      <h3><Link href={`/stories/moments/${story.slug}`}>{story[locale].title}</Link></h3>
      <p>{story[locale].summary}</p>
      <Link className={styles.read} href={`/stories/moments/${story.slug}`}>{uk ? 'Читати історію' : 'Read story'} <span aria-hidden="true">↗</span></Link>
    </li>)}</ul>
  </section>;
}
