import type { Metadata } from 'next';
import { editorialStoryPreviews } from '@/components/stories/editorial-previews';
import { releasePilots, journeyYears } from '@/components/stories/release-model';
import { resolveReleaseDriver } from '@/components/stories/release-data';
import { MotorsportArt } from '@/components/stories/motorsport-art';
import { routeMetadata, pageStructuredData, serializeJsonLd, siteOrigin } from '@/lib/seo';
import styles from '@/components/stories/release.module.css';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { ...routeMetadata(locale, '/stories'), title: locale === 'uk' ? 'Історії пілотів' : 'Driver stories', description: locale === 'uk' ? 'П’ять маршрутів історією Формули-1: сезони, команди та протоколи гонок.' : 'Five journeys through Formula 1: seasons, constructors and race evidence.' };
}
export default async function Stories({ params }: Props) {
  const { locale: raw } = await params, locale = raw === 'en' ? 'en' : 'uk', uk = locale === 'uk';
  const items = await Promise.all(releasePilots.map(async pilot => ({ pilot, data: await resolveReleaseDriver(pilot.slug, locale) })));
  const origin = siteOrigin(), title = uk ? 'Історії пілотів' : 'Driver stories';
  return <div className={`page ${styles.release}`}>
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageStructuredData(origin, locale, [{ name: 'Grid Atlas', path: '/' }, { name: title, path: '/stories' }], title)) }} />}
    <header className={styles.hubHero}><p className={styles.eyebrow}>GRID ATLAS / {uk ? 'П’ЯТЬ МАРШРУТІВ' : 'FIVE JOURNEYS'}</p><h1>{title}<span>{uk ? 'Одна гонка. Безліч зв’язків.' : 'One race. Countless connections.'}</span></h1>
      <p>{uk ? 'Оберіть пілота. Рухайтеся крізь сезони, відкривайте команди й повертайтеся до протоколів. Кожен маршрут починається з реальних записів.' : 'Choose a driver. Move through seasons, discover constructors and return to the race records. Every journey starts with observed results.'}</p>
      <p className={styles.note}>{uk ? 'Це маршрути архівом. Історичні тексти додаються лише після окремого редакційного схвалення кожної мови.' : 'These are archive journeys. Historical writing appears only after separate editorial approval for each language.'}</p>
    </header>
    <div className={styles.covers}>{items.map(({ pilot, data }, i) => <article key={pilot.slug} className={styles.cover} data-story-reveal>
      <div className={styles.coverArt}><MotorsportArt kind={i % 2 ? 'velocity' : 'helmet'} tone={pilot.tone} /></div>
      <div className={styles.coverCopy}><p className={styles.eyebrow}>{String(i + 1).padStart(2, '0')} / {data ? journeyYears(pilot, data.career.participation).join(' · ') : (uk ? 'Немає записів' : 'No records')}</p>
        <h2>{data ? <a href={`/${locale}/stories/${pilot.slug}`}>{data.profile.name}<span aria-hidden="true"> ↗</span></a> : pilot.slug}</h2>
        <p>{pilot.prompt[locale]}</p>{data ? <a href={`/${locale}/stories/${pilot.slug}`}>{uk ? 'Відкрити маршрут' : 'Open journey'} →</a> : <p>{uk ? 'Цей пілот ще не доступний в імпортованому архіві.' : 'This driver is not available in the imported archive yet.'}</p>}</div>
    </article>)}</div>
    <section aria-labelledby="editorial-preview-heading" style={{ margin: 'clamp(48px, 8vw, 100px) auto', maxWidth: 1200, padding: '0 20px' }}>
      <p className={styles.eyebrow}>GRID ATLAS / {uk ? '10 РЕДАКЦІЙНИХ АНОНСІВ' : '10 EDITORIAL PREVIEWS'}</p>
      <h2 id="editorial-preview-heading" style={{ fontSize: 'clamp(30px, 4vw, 56px)', lineHeight: 1.12 }}>{uk ? 'Моменти, за якими стоять історії' : 'Moments with stories behind them'}</h2>
      <p className={styles.note}>{uk ? 'Короткі вступи до майбутніх матеріалів. Повні статті ще проходять редакційну перевірку.' : 'Short introductions to upcoming features. Full articles are still under editorial review.'}</p>
      <ol style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: 20, marginTop: 28 }}>
        {editorialStoryPreviews.map((story, index) => {
          const copy = story[locale];
          return <li key={story.slug} style={{ border: '1px solid currentColor', borderRadius: 6, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} / {story.year}</span>
            <h3 style={{ fontSize: '1.5rem', lineHeight: 1.2, margin: 0 }}>{copy.title}</h3>
            <p style={{ lineHeight: 1.65, margin: 0 }}>{copy.summary}</p>
            <p style={{ opacity: .75, fontSize: '.85rem', marginTop: 'auto' }}>{uk ? 'Повна історія готується' : 'Full story in preparation'}</p>
          </li>;
        })}
      </ol>
    </section>
    <aside className={styles.scope}><h2>{uk ? 'Протокол — початок дослідження' : 'A record is a starting point'}</h2><p>{uk ? 'Записи результатів не є підтвердженням контрактів або офіційних стартів. Прогалини не доводять відсутності участі. Історію конструкторів та заявників досліджуйте окремо.' : 'Result entries do not establish contracts or official starts. Missing records do not prove nonparticipation. Constructor and entrant identities remain distinct.'}</p><a href={`/${locale}/sources`}>{uk ? 'Походження даних' : 'Data provenance'} ↗</a></aside>
  </div>;
}
