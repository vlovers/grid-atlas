import { isAiReviewedStory } from '@/components/stories/editorial-publication';
import { editorialOfficialResults } from '@/components/stories/editorial-official-results';
import { editorialSeasonRaceWinners } from '@/components/stories/editorial-season-race-winners';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { editorialStoryPreviews } from '@/components/stories/editorial-previews';
import { relatedEditorialMoments } from '@/components/stories/editorial-related';
import { draftArticle } from '@/components/stories/editorial-draft-articles';
import { resolveEditorialPeople } from '@/components/stories/editorial-people-resolver';
import { resolveEditorialRaces } from '@/components/stories/editorial-race-resolver';
import { storyRaceContext } from '@/components/stories/editorial-race-context';
import { MotorsportArt, type ArtKind } from '@/components/stories/motorsport-art';
import { approvedEditorialPhoto } from '@/components/stories/editorial-media';
import { editorialReaderQuestions } from '@/components/stories/editorial-reader-questions';
import { editorialResultHighlights } from '@/components/stories/editorial-result-highlights';
import styles from '@/components/stories/release.module.css';

type Props = { params: Promise<{ locale: string; slug: string }> };
function resolve(slug: string) { return editorialStoryPreviews.find(item => item.slug === slug); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = resolve(slug);
  if ((locale !== 'uk' && locale !== 'en') || !story) notFound();
  return { title: `${story[locale].title} — Grid Atlas`, description: story[locale].summary, robots: { index: isAiReviewedStory(slug), follow: true }, alternates: { languages: { en: `/en/stories/moments/${slug}`, uk: `/uk/stories/moments/${slug}` } } };
}

/** Deliberately separate from the existing /stories/[slug] driver routes.
 *  Unapproved research manuscripts must never be exposed as published articles. */
export default async function EditorialMoment({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== 'uk' && locale !== 'en') notFound();
  const story = resolve(slug);
  if (!story) notFound();
  const published = isAiReviewedStory(slug);
  const uk = locale === 'uk';
  const copy = story[locale];
  const related = relatedEditorialMoments(slug);
  const siblingLocale = uk ? 'en' : 'uk';
  const chapters = draftArticle(slug, locale);
  const artKinds: ArtKind[] = ['duel', 'apex', 'velocity', 'grid', 'helmet'];
  const storyIndex = editorialStoryPreviews.findIndex(item => item.slug === slug);
  const artKind = artKinds[storyIndex % artKinds.length];
  const artTone = (['gold', 'violet', 'coral', 'mint'] as const)[storyIndex % 4];
  const photo = approvedEditorialPhoto(slug);
  const [protagonists, races] = await Promise.all([resolveEditorialPeople(slug), resolveEditorialRaces(slug)]);
  return <main className={`page ${styles.release} ${styles.editorialReading}`}>
    <div className={styles.editorialProgress} aria-hidden="true" />
    <nav aria-label={uk ? 'Навігація' : 'Navigation'} style={{ marginBottom: 64, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}><a href={`/${locale}/stories`}>{uk ? '← Усі історії' : '← All stories'}</a><a href={`/${siblingLocale}/stories/moments/${slug}`} hrefLang={siblingLocale} lang={siblingLocale}>{uk ? 'Read in English →' : 'Читати українською →'}</a></nav>
    <article>
      <header className={styles.editorialHero}>
        <div className={styles.editorialHeroArt}>{photo ? <Image src={photo.src} alt="" fill sizes="(max-width: 760px) 100vw, 1040px" className={styles.editorialPhotoBackdrop} /> : <MotorsportArt kind={artKind} tone={artTone} />}</div>
        <p className={styles.eyebrow}>GRID ATLAS / {story.year} / {published ? (uk ? 'ІСТОРІЯ' : 'FEATURE') : (uk ? 'РЕДАКЦІЙНИЙ АНОНС' : 'EDITORIAL PREVIEW')}</p>
        <span className={styles.aiReviewedLabel}>{published ? 'AI-reviewed' : (uk ? 'AI-перевірка джерел · чернетка' : 'AI source-check · draft')}</span>
        <h1 style={{ maxWidth: 'none' }}>{copy.title}</h1>
        <p className={styles.lead}>{copy.summary}</p>
        {photo && <p className={styles.editorialPhotoCredit}>{photo.caption[locale]} · {uk ? "Фото" : "Photo"}: {photo.creator} · <a href={photo.sourceUrl} rel="noopener noreferrer">{uk ? "Джерело" : "Source"}</a> · <a href={photo.licenseUrl} rel="noopener noreferrer">{photo.license}</a> · {photo.changes}</p>}
      </header>
      <nav className={styles.editorialReadingPaths} aria-label={uk ? 'Перейти до розділу' : 'Jump to section'}>
        <a className={styles.editorialReadingPrimary} href="#research-chapters">{uk ? 'Читати історію ↓' : 'Read the story ↓'}</a>
        <a href="#story-races">{uk ? 'Гонки та результати' : 'Races & results'}</a>
      </nav>
      {chapters && <section aria-labelledby="research-chapters" style={{ marginTop: 64, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <p className={styles.eyebrow}>{published ? (uk ? 'РОЗГОРНУТА ІСТОРІЯ' : 'LONG READ') : (uk ? 'РОЗГОРНУТА ІСТОРІЯ / РЕДАКЦІЙНА ЧЕРНЕТКА' : 'LONG READ / EDITORIAL DRAFT')}</p>
        <h2 id="research-chapters">{uk ? 'Історія в деталях' : 'The story in depth'}</h2>
        
        <div className={styles.editorialChapters}>
          <nav className={styles.editorialChapterNav} aria-label={uk ? 'Розділи статті' : 'Article chapters'}>
            {chapters.map((chapter, index) => <a key={index} href={`#chapter-${index + 1}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')} · </span>{chapter.heading}</a>)}
          </nav>
          <div className={styles.editorialProse}>
            {chapters.map((chapter, index) => <section key={index} id={`chapter-${index + 1}`}>
              <p className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</p>
              <h3>{chapter.heading}</h3>
              {chapter.paragraphs.map((paragraph, p) => <p key={p}>{paragraph}</p>)}
            </section>)}
          </div>
        </div>
      </section>}
      <section aria-labelledby="story-people" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ДІЙОВІ ОСОБИ' : 'THE PEOPLE'}</p>
        <h2 id="story-people">{uk ? 'Хто стоїть за цією історією' : 'The people behind the story'}</h2>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 0, listStyle: 'none' }}>
          {protagonists.map(person => <li key={person.externalId} style={{ padding: '12px 16px', border: '1px solid var(--line)' }}>
            {person.id ? <a href={`/${locale}/drivers/${person.id}`}>{uk ? person.uk : person.en} ↗</a> : <span>{uk ? person.uk : person.en}</span>}
          </li>)}
        </ul>
        <p className={styles.note}>{uk ? 'Відкрийте профіль гонщика, щоб дізнатися більше.' : 'Explore a driver profile to learn more.'}</p>
      </section>
      <section aria-labelledby="story-races" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ПЕРЕВІРИТИ В АРХІВІ' : 'EXPLORE THE ARCHIVE'}</p>
        <h2 id="story-races">{uk ? 'Гонки, що змінили історію' : 'The races behind the story'}</h2>
        <ol className={styles.editorialRaceTrack} style={{ listStyle: 'none' }}>
          {races.map((race, index) => <li key={`${race.year}-${race.round}`} className={styles.editorialRaceCard}>
            <span className={styles.editorialRaceNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <p className={styles.eyebrow}>{race.year} / {uk ? 'ЕТАП' : 'ROUND'} {race.round}</p>
            <h3>{uk ? race.uk : race.en}</h3>
            <p>{storyRaceContext(slug, index, locale)}</p>
            {race.id ? <a href={`/${locale}/races/${race.id}`}>{uk ? 'Дивитися результати гонки ↗' : 'Explore race results ↗'}</a> : <p className={styles.note}>{uk ? 'Архівне посилання ще не підтверджено' : 'Archive link not yet confirmed'}</p>}
            {race.id && <p className={styles.note}>{uk ? `Зіставлено з архівом · ${race.verifiedBy} пілот(ів)` : `Matched to archive · ${race.verifiedBy} driver(s)`}</p>}
          </li>)}
        </ol>
        <p className={styles.note}>{uk ? 'Виберіть гонку, щоб переглянути повні результати.' : 'Choose a race to explore the full results.'}</p>
      </section>
      {['massa-2008', 'brawn-2009'].includes(slug) && <details className={styles.provenance} aria-labelledby="season-winners" style={{ marginTop: 48 }}>
        <summary id="season-winners">{uk ? 'Усі переможці сезону' : 'Every race winner that season'}</summary>
        <p>{uk ? 'Повна хронологія перемог за офіційними підсумками Формули-1.' : 'The complete season victory sequence, from the official Formula 1 results archive.'}</p>
        <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12, paddingLeft: 24 }}>
          {editorialSeasonRaceWinners.filter(race => race.year === (slug === 'massa-2008' ? 2008 : 2009)).map(race => <li key={race.id}>
            <strong>{race.grandPrix[locale]}</strong><br />
            {race.winner[locale]} · {race.constructor}<br />
            <small>{race.laps} {uk ? 'кіл' : 'laps'}</small>
            <h3 style={{ margin: '12px 0 6px', fontSize: '1.1rem' }}>{race.editorialChapter[locale].title}</h3>
            <p style={{ marginTop: 8, maxWidth: '38ch' }}>{race.editorialMoment[locale]}</p>
            <p style={{ maxWidth: '38ch' }}>{race.editorialChapter[locale].detail}</p>
            <p style={{ maxWidth: '38ch', opacity: 0.82 }}><em>{race.editorialSignificance[locale]}</em></p>
          </li>)}
        </ol>
        <a href={slug === 'massa-2008' ? 'https://www.formula1.com/en/results/2008/races' : 'https://www.formula1.com/en/results/2009/races'} target="_blank" rel="noopener noreferrer">{uk ? 'Джерело: офіційні результати F1 ↗' : 'Source: official F1 results ↗'}</a>
      </details>}
      {slug in editorialResultHighlights && <section aria-labelledby="result-highlights" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ЦИФРИ З АРХІВУ' : 'FROM THE RACE CLASSIFICATION'}</p>
        <h2 id="result-highlights">{uk ? 'Що показує протокол' : 'What the result sheet shows'}</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, padding: 0, listStyle: 'none' }}>
          {editorialResultHighlights[slug as keyof typeof editorialResultHighlights].map(item => <li key={item.id} style={{ padding: 16, borderTop: '2px solid var(--accent-ink)' }}>
            <span className={styles.eyebrow}>{item.metric}</span>
            <p style={{ margin: '8px 0' }}>{item[locale]}</p>
            <a href={item.sourceUrl} rel="noopener noreferrer" target="_blank">{uk ? 'Протокол F1 ↗' : 'F1 classification ↗'}</a>
          </li>)}
        </ul>
        <p className={styles.note}>{uk ? 'Дані з офіційного протоколу. Редакційна перевірка всього тексту триває.' : 'Official classification data. The full manuscript still awaits editorial review.'}</p>
      </section>}
      {slug in editorialReaderQuestions && <details className={styles.provenance} aria-labelledby="reader-questions" style={{ marginTop: 56, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? 'ЗАПИТАННЯ ЧИТАЧІВ' : 'READER QUESTIONS'}</p>
        <summary id="reader-questions">{uk ? 'Що варто знати' : 'What to know'}</summary>
        {editorialReaderQuestions[slug as keyof typeof editorialReaderQuestions].map((item, index) => <details key={index} className={styles.provenance}>
          <summary>{item[locale].question}</summary>
          <p>{item[locale].answer}</p>
        </details>)}
        <p className={styles.note}>{uk ? 'Деталі та відповіді на найчастіші запитання.' : 'More detail and answers to common questions.'}</p>
      </details>}
      <section aria-labelledby="official-results" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <h2 id="official-results">{uk ? 'Офіційні результати' : 'Official race results'}</h2>
        <ul>
          {(editorialOfficialResults[slug] ?? []).map(source => <li key={source.year}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{uk ? `Сезон ${source.year} · Formula 1` : `${source.year} season · Formula 1`}</a>
          </li>)}
        </ul>
      </section>
      {!published && <details className={styles.provenance} style={{ marginTop: 48 }}>
        <summary id="preview-status">{uk ? 'Статус матеріалу' : 'Article status'}</summary>
        <p className={styles.note}>{uk ? 'Стаття проходить фінальну перевірку джерел; публікацію ще не затверджено.' : 'Source review is still in progress; publication has not yet been approved.'}</p>
      </details>}
      <aside aria-labelledby="related-moments" style={{ borderTop: '1px solid var(--line)', marginTop: 64, paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? 'ПРОДОВЖИТИ ЧИТАТИ' : 'KEEP READING'}</p>
        <h2 id="related-moments">{uk ? 'Інші погляди на історію' : 'Another way into the history'}</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 18, listStyle: 'none', padding: 0 }}>
          {related.map(item => <li key={item.slug} style={{ borderTop: '2px solid var(--accent-ink)', paddingTop: 16 }}>
            <span className={styles.eyebrow}>{item.year}</span>
            <h3><a href={`/${locale}/stories/moments/${item.slug}`}>{item[locale].title} ↗</a></h3>
            <p>{item[locale].summary}</p>
          </li>)}
        </ul>
      </aside>
    </article>
  </main>;
}
