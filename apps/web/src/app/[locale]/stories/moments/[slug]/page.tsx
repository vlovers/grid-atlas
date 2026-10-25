import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { editorialStoryPreviews } from '@/components/stories/editorial-previews';
import { editorialMomentPath } from '@/components/stories/editorial-moment-model';
import { momentScenes } from '@/components/stories/editorial-moment-scenes';
import { relatedEditorialMoments } from '@/components/stories/editorial-related';
import { draftArticle } from '@/components/stories/editorial-draft-articles';
import { resolveEditorialPeople } from '@/components/stories/editorial-people-resolver';
import { resolveEditorialRaces } from '@/components/stories/editorial-race-resolver';
import { storyRaceContext } from '@/components/stories/editorial-race-context';
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
  const beats = editorialMomentPath(slug, locale);
  const scenes = momentScenes(slug, locale);
  const related = relatedEditorialMoments(slug);
  const siblingLocale = uk ? 'en' : 'uk';
  const chapters = draftArticle(slug, locale);
  const [protagonists, races] = await Promise.all([resolveEditorialPeople(slug), resolveEditorialRaces(slug)]);
  return <main className={`page ${styles.release}`} style={{ maxWidth: 1040, margin: '0 auto' }}>
    <nav aria-label={uk ? 'Навігація' : 'Navigation'} style={{ marginBottom: 64, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}><a href={`/${locale}/stories`}>{uk ? '← Усі історії' : '← All stories'}</a><a href={`/${siblingLocale}/stories/moments/${slug}`} hrefLang={siblingLocale} lang={siblingLocale}>{uk ? 'Read in English →' : 'Читати українською →'}</a></nav>
    <article>
      <header style={{ maxWidth: 850 }}>
        <p className={styles.eyebrow}>GRID ATLAS / {story.year} / {uk ? 'РЕДАКЦІЙНИЙ АНОНС' : 'EDITORIAL PREVIEW'}</p>
        <h1 style={{ maxWidth: 'none' }}>{copy.title}</h1>
        <p className={styles.lead}>{copy.summary}</p>
      </header>
      <section aria-labelledby="story-people" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ДІЙОВІ ОСОБИ' : 'THE PEOPLE'}</p>
        <h2 id="story-people">{uk ? 'Хто стоїть за цією історією' : 'The people behind the story'}</h2>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 0, listStyle: 'none' }}>
          {protagonists.map(person => <li key={person.externalId} style={{ padding: '12px 16px', border: '1px solid var(--line)' }}>
            {person.id ? <a href={`/${locale}/drivers/${person.id}`}>{uk ? person.uk : person.en} ↗</a> : <span>{uk ? person.uk : person.en}</span>}
          </li>)}
        </ul>
        <p className={styles.note}>{uk ? 'Посилання доступні лише для пілотів, чий ідентифікатор точно збігається з архівом F1DB.' : 'Links appear only when the driver's identifier matches the canonical F1DB archive.'}</p>
      </section>
      <section aria-labelledby="story-races" style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <p className={styles.eyebrow}>{uk ? 'ПЕРЕВІРИТИ В АРХІВІ' : 'EXPLORE THE ARCHIVE'}</p>
        <h2 id="story-races">{uk ? 'Гонки, що змінили історію' : 'The races behind the story'}</h2>
        <ol style={{ display: 'grid', gap: 0, padding: '0 0 0 18px', listStyle: 'none', borderLeft: '2px solid var(--accent-ink)' }}>
          {races.map((race, index) => <li key={`${race.year}-${race.round}`} style={{ position: 'relative', padding: '12px 0 28px 24px' }}>
            <span aria-hidden="true" style={{ position: 'absolute', top: 18, left: -25, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-ink)', border: '2px solid var(--surface, #fff)' }} />
            <p className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} / {race.year} / {uk ? 'ЕТАП' : 'ROUND'} {race.round}</p>
            <h3 style={{ margin: '8px 0', fontSize: 'clamp(22px, 2.5vw, 30px)' }}>{race.id ? <a href={`/${locale}/races/${race.id}`}>{uk ? race.uk : race.en} ↗</a> : (uk ? race.uk : race.en)}</h3>
            <p style={{ lineHeight: 1.7, maxWidth: '64ch' }}>{storyRaceContext(slug, index, locale)}</p>
            <p className={styles.note}>{race.id ? (uk ? `Архівний запис підтверджено · пілотів у протоколі: ${race.verifiedBy}` : `Archive record matched · drivers corroborating: ${race.verifiedBy}`) : (uk ? 'Архівне посилання поки не підтверджено' : 'Archive link not yet confirmed')}</p>
          </li>)}
        </ol>
        <p className={styles.note}>{uk ? 'Посилання з’являються лише після підтвердження гонки в результатах пілота за рік і етап.' : 'Race links appear only when a driver’s archive results confirm the year and round.'}</p>
      </section>
      {beats && <section aria-labelledby="reading-path" style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? "ЧОТИРИ СЮЖЕТНІ МОМЕНТИ" : "FOUR STORY BEATS"}</p>
        <h2 id="reading-path">{uk ? "Маршрут історією" : "A path through the story"}</h2>
        <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 18, listStyle: "none", padding: 0 }}>
          {beats.map((beat, index) => <li key={beat} style={{ borderTop: "2px solid var(--accent-ink)", paddingTop: 14 }}><span className={styles.eyebrow}>{String(index + 1).padStart(2, "0")}</span><h3 style={{ margin: "12px 0" }}>{beat}</h3>{scenes?.[index] && <p style={{ lineHeight: 1.7 }}>{scenes[index]}</p>}</li>)}
        </ol>
        <p className={styles.note}>{uk ? "Це редакційний маршрут, а не перевірена покрокова хронологія гонки." : "This is an editorial reading path, not a verified lap-by-lap race timeline."}</p>
      </section>}
      {chapters && <section aria-labelledby="research-chapters" style={{ marginTop: 64, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? 'РОЗГОРНУТА ІСТОРІЯ / РЕДАКЦІЙНА ЧЕРНЕТКА' : 'LONG READ / EDITORIAL DRAFT'}</p>
        <h2 id="research-chapters">{uk ? 'Історія в деталях' : 'The story in depth'}</h2>
        <p className={styles.note}>{uk ? 'Матеріал доступний для ознайомлення, але ще не пройшов незалежної перевірки джерел. Не вважайте його остаточною публікацією.' : 'This manuscript is available to read but has not yet passed independent source verification. It is not a final publication.'}</p>
        <nav aria-label={uk ? 'Розділи статті' : 'Article chapters'} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '32px 0' }}>
          {chapters.map((chapter, index) => <a key={index} href={`#chapter-${index + 1}`} style={{ padding: '10px 14px', border: '1px solid var(--line)' }}>{String(index + 1).padStart(2, '0')} · {chapter.heading}</a>)}
        </nav>
        {chapters.map((chapter, index) => <section key={index} id={`chapter-${index + 1}`} style={{ padding: '36px 0', borderTop: '1px solid var(--line)', scrollMarginTop: 100 }}>
          <p className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</p>
          <h3 style={{ fontSize: 'clamp(26px, 3vw, 42px)' }}>{chapter.heading}</h3>
          {chapter.paragraphs.map((paragraph, p) => <p key={p} style={{ fontSize: '1.075rem', lineHeight: 1.85, maxWidth: '72ch' }}>{paragraph}</p>)}
        </section>)}
      </section>}
      <section aria-labelledby="preview-status" style={{ borderTop: '1px solid var(--line)', marginTop: 60, paddingTop: 32 }}>
        <h2 id="preview-status">{uk ? 'Остаточна редакція готується' : 'The verified edition is in preparation'}</h2>
        <p>{uk ? 'Це редакційна чернетка повної статті. Матеріал ще проходить історичну перевірку, редактуру української та англійської версій і перевірку джерел. Ми не показуємо неперевірену чернетку як готову публікацію.' : 'This is a short introduction to an upcoming feature. The long-form manuscript is still undergoing historical fact-checking, English and Ukrainian editing, and source review. We do not present unverified research as a published article.'}</p>
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
