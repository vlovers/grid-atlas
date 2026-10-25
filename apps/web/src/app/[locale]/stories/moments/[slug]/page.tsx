import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { editorialStoryPreviews } from '@/components/stories/editorial-previews';
import { editorialMomentPath } from '@/components/stories/editorial-moment-model';
import { momentScenes } from '@/components/stories/editorial-moment-scenes';
import styles from '@/components/stories/release.module.css';

type Props = { params: Promise<{ locale: string; slug: string }> };
function resolve(slug: string) { return editorialStoryPreviews.find(item => item.slug === slug); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = resolve(slug);
  if ((locale !== 'uk' && locale !== 'en') || !story) notFound();
  return { title: `${story[locale].title} — Grid Atlas`, description: story[locale].summary, robots: { index: false, follow: true } };
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
  return <main className={`page ${styles.release}`} style={{ maxWidth: 1040, margin: '0 auto' }}>
    <nav aria-label={uk ? 'Навігація' : 'Navigation'} style={{ marginBottom: 64 }}><a href={`/${locale}/stories`}>{uk ? '← Усі історії' : '← All stories'}</a></nav>
    <article>
      <header style={{ maxWidth: 850 }}>
        <p className={styles.eyebrow}>GRID ATLAS / {story.year} / {uk ? 'РЕДАКЦІЙНИЙ АНОНС' : 'EDITORIAL PREVIEW'}</p>
        <h1 style={{ maxWidth: 'none' }}>{copy.title}</h1>
        <p className={styles.lead}>{copy.summary}</p>
      </header>
      {beats && <section aria-labelledby="reading-path" style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
        <p className={styles.eyebrow}>{uk ? "ЧОТИРИ СЮЖЕТНІ МОМЕНТИ" : "FOUR STORY BEATS"}</p>
        <h2 id="reading-path">{uk ? "Маршрут історією" : "A path through the story"}</h2>
        <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 18, listStyle: "none", padding: 0 }}>
          {beats.map((beat, index) => <li key={beat} style={{ borderTop: "2px solid var(--accent-ink)", paddingTop: 14 }}><span className={styles.eyebrow}>{String(index + 1).padStart(2, "0")}</span><h3 style={{ margin: "12px 0" }}>{beat}</h3>{scenes?.[index] && <p style={{ lineHeight: 1.7 }}>{scenes[index]}</p>}</li>)}
        </ol>
        <p className={styles.note}>{uk ? "Це редакційний маршрут, а не перевірена покрокова хронологія гонки." : "This is an editorial reading path, not a verified lap-by-lap race timeline."}</p>
      </section>}
      <section aria-labelledby="preview-status" style={{ borderTop: '1px solid var(--line)', marginTop: 60, paddingTop: 32 }}>
        <h2 id="preview-status">{uk ? 'Повна історія готується' : 'The full story is in preparation'}</h2>
        <p>{uk ? 'Це короткий вступ до майбутньої статті. Довгий матеріал ще проходить історичну перевірку, редактуру української та англійської версій і перевірку джерел. Ми не показуємо неперевірену чернетку як готову публікацію.' : 'This is a short introduction to an upcoming feature. The long-form manuscript is still undergoing historical fact-checking, English and Ukrainian editing, and source review. We do not present unverified research as a published article.'}</p>
        <a href={`/${locale}/stories`}>{uk ? 'Переглянути інші історії' : 'Explore other stories'} →</a>
      </section>
    </article>
  </main>;
}
