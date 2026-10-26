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
import { editorialReflection } from '@/components/stories/editorial-reflection';
import { editorialInterpretivePassages } from '@/components/stories/editorial-interpretive-passages';
import { editorialReaderQuestions } from '@/components/stories/editorial-reader-questions';
import { editorialStoryContext } from '@/components/stories/editorial-story-context';
import { editorialMilestones } from '@/components/stories/editorial-milestones';
import { editorialFactCheckPrompts } from '@/components/stories/editorial-fact-check-prompts';
import styles from '@/components/stories/release.module.css';

type Props = { params: Promise<{ locale: string; slug: string }> };
function resolve(slug: string) { return editorialStoryPreviews.find(item => item.slug === slug); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = resolve(slug);
  if ((locale !== 'uk' && locale !== 'en') || !story) notFound();
  return { title: `${story[locale].title} — Grid Atlas`, description: story[locale].summary, robots: { index: false, follow: true }, alternates: { languages: { en: `/en/stories/moments/${slug}`, uk: `/uk/stories/moments/${slug}` } } };
}

/** Deliberately separate from the existing /stories/[slug] driver routes.
 *  Unapproved research manuscripts must never be exposed as published articles. */
export default async function EditorialMoment({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== 'uk' && locale !== 'en') notFound();
  const story = resolve(slug);
  if (!story) notFound();
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
        <p className={styles.eyebrow}>GRID ATLAS / {story.year} / {uk ? 'РЕДАКЦІЙНИЙ АНОНС' : 'EDITORIAL PREVIEW'}</p>
        <h1 style={{ maxWidth: 'none' }}>{copy.title}</h1>
        <p className={styles.lead}>{copy.summary}</p>
        {photo && <p className={styles.editorialPhotoCredit}>{photo.caption[locale]} · {uk ? "Фото" : "Photo"}: {photo.creator} · <a href={photo.sourceUrl} rel="noopener noreferrer">{uk ? "Джерело" : "Source"}</a> · <a href={photo.licenseUrl} rel="noopener noreferrer">{photo.license}</a> · {photo.changes}</p>}
      </header>
      {slug in editorialStoryContext && <section aria-label={uk ? 'Контекст історії' : 'Story context'} style={{ marginTop: 32, padding: '24px 28px', borderLeft: '4px solid var(--accent-ink)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <p className={styles.eyebrow}>{uk ? 'КОРОТКО ПРО ГОЛОВНЕ' : 'THE STORY AT A GLANCE'}</p>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', marginBottom: 8 }}>{editorialStoryContext[slug as keyof typeof editorialStoryContext][locale].label}</h2>
        <p style={{ maxWidth: '65ch', marginBottom: 0 }}>{editorialStoryContext[slug as keyof typeof editorialStoryContext][locale].description}</p>
      </section>}
      {slug in editorialMilestones && <section aria-labelledby="story-milestones" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ІСТОРІЯ У ЧОТИРЬОХ МОМЕНТАХ' : 'FOUR MOMENTS THAT MATTER'}</p>
        <h2 id="story-milestones">{uk ? 'Як розгорталися події' : 'How the story unfolded'}</h2>
        <ol className={styles.editorialActs}>
          {editorialMilestones[slug as keyof typeof editorialMilestones].map((moment, index) => <li key={index} className={styles.editorialAct}>
            <h3>{moment[locale].title}</h3>
            <p>{moment[locale].detail}</p>
            <small>{uk ? `Момент ${index + 1} з 4` : `Moment ${index + 1} of 4`}</small>
          </li>)}
        </ol>
        <p className={styles.note}>{uk ? 'Це стислий редакційний виклад, а не перевірена покрокова хронологія.' : 'An editorial overview, not an independently verified lap-by-lap chronology.'}</p>
      </section>}
      <section aria-labelledby="story-people" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ДІЙОВІ ОСОБИ' : 'THE PEOPLE'}</p>
        <h2 id="story-people">{uk ? 'Хто стоїть за цією історією' : 'The people behind the story'}</h2>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 0, listStyle: 'none' }}>
          {protagonists.map(person => <li key={person.externalId} style={{ padding: '12px 16px', border: '1px solid var(--line)' }}>
            {person.id ? <a href={`/${locale}/drivers/${person.id}`}>{uk ? person.uk : person.en} ↗</a> : <span>{uk ? person.uk : person.en}</span>}
          </li>)}
        </ul>
        <p className={styles.note}>{uk ? 'Посилання доступні лише для пілотів, чий ідентифікатор точно збігається з архівом F1DB.' : "Links appear only when the driver’s identifier matches the canonical F1DB archive."}</p>
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
        <p className={styles.note}>{uk ? 'Посилання з’являються лише після підтвердження гонки в результатах пілота за рік і етап.' : 'Race links appear only when a driver’s archive results confirm the year and round.'}</p>
      </section>
      {chapters && <section aria-labelledby="research-chapters" style={{ marginTop: 64, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? 'РОЗГОРНУТА ІСТОРІЯ / РЕДАКЦІЙНА ЧЕРНЕТКА' : 'LONG READ / EDITORIAL DRAFT'}</p>
        <h2 id="research-chapters">{uk ? 'Історія в деталях' : 'The story in depth'}</h2>
        <p className={styles.note}>{uk ? 'Матеріал доступний для ознайомлення, але ще не пройшов незалежної перевірки джерел. Не вважайте його остаточною публікацією.' : 'This manuscript is available to read but has not yet passed independent source verification. It is not a final publication.'}</p>
        <div className={styles.editorialChapters}>
          <nav className={styles.editorialChapterNav} aria-label={uk ? 'Розділи статті' : 'Article chapters'}>
            {chapters.map((chapter, index) => <a key={index} href={`#chapter-${index + 1}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')} · </span>{chapter.heading}</a>)}
          </nav>
          <div className={styles.editorialProse}>
            {chapters.map((chapter, index) => <section key={index} id={`chapter-${index + 1}`}>
              <p className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</p>
              <h3>{chapter.heading}</h3>
              {chapter.paragraphs.map((paragraph, p) => <p key={p}>{paragraph}</p>)}
              {index < 3 && slug in editorialInterpretivePassages && <p className={styles.editorialInterpretation}>{editorialInterpretivePassages[slug as keyof typeof editorialInterpretivePassages][index][locale]}</p>}
            </section>)}
          </div>
        </div>
      </section>}
      {slug in editorialReaderQuestions && <section aria-labelledby="reader-questions" style={{ marginTop: 56, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? 'ЗАПИТАННЯ ЧИТАЧІВ' : 'READER QUESTIONS'}</p>
        <h2 id="reader-questions">{uk ? 'Що варто знати' : 'What to know'}</h2>
        {editorialReaderQuestions[slug as keyof typeof editorialReaderQuestions].map((item, index) => <details key={index} className={styles.provenance}>
          <summary>{item[locale].question}</summary>
          <p>{item[locale].answer}</p>
        </details>)}
        <p className={styles.note}>{uk ? 'Короткі відповіді є частиною редакційної чернетки й очікують перевірки джерел.' : 'Short answers are part of the editorial draft and await independent source review.'}</p>
      </section>}
      {slug in editorialReflection && <aside aria-labelledby="story-reflection" style={{ marginTop: 56, padding: 'clamp(24px, 5vw, 56px)', background: 'var(--surface, transparent)', border: '1px solid var(--line)' }}>
        <p className={styles.eyebrow}>{uk ? 'ПИТАННЯ ПІСЛЯ ІСТОРІЇ' : 'A QUESTION TO TAKE AWAY'}</p>
        <h2 id="story-reflection" style={{ fontSize: 'clamp(28px, 4vw, 52px)', maxWidth: '24ch', lineHeight: 1.2 }}>{editorialReflection[slug as keyof typeof editorialReflection][locale]}</h2>
        <p className={styles.note}>{uk ? 'Не тест і не готова відповідь — лише привід подивитися на події під іншим кутом.' : 'Not a quiz or a verdict — just another way to think about what happened.'}</p>
      </aside>}
      {slug in editorialFactCheckPrompts && <details style={{ marginTop: 48, padding: '24px 28px', border: '1px solid var(--line)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 44 }}>
          {uk ? 'Редакційна перевірка фактів — 5 тверджень' : 'Editorial fact-check queue — 5 claims'}
        </summary>
        <p className={styles.note}>{uk ? 'Ці твердження ще очікують незалежних джерел. Перелік показано для прозорості, а не як підтверджені факти.' : 'These claims still need independent sources. This queue is shown for transparency, not as verified evidence.'}</p>
        <ol style={{ display: 'grid', gap: 12, paddingInlineStart: 24 }}>
          {editorialFactCheckPrompts[slug as keyof typeof editorialFactCheckPrompts].map((claim, index) => <li key={index}>{claim[locale]} <small className={styles.note}>· {uk ? 'Джерело очікується' : 'Source pending'}</small></li>)}
        </ol>
      </details>}
      <section aria-labelledby="preview-status" style={{ borderTop: '1px solid var(--line)', marginTop: 60, paddingTop: 32 }}>
        <h2 id="preview-status">{uk ? 'Остаточна редакція готується' : 'The verified edition is in preparation'}</h2>
        <p>{uk ? 'Це редакційна чернетка повної статті. Матеріал ще проходить історичну перевірку, редактуру української та англійської версій і перевірку джерел. Ми не показуємо неперевірену чернетку як готову публікацію.' : 'This is a full editorial manuscript awaiting verification. The long-form manuscript is still undergoing historical fact-checking, English and Ukrainian editing, and source review. We do not present unverified research as a published article.'}</p>
        <a href={`/${locale}/stories`}>{uk ? 'Переглянути інші історії' : 'Explore other stories'} →</a>
      </section>
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
