import { EditorialHero, SectionHeading, SourceAttribution } from '@/components/editorial/primitives';
import { ArchivePlate } from '@/components/editorial/archive-plate';
import { archiveCopy } from '@/components/editorial/archive-copy';
import { seasonDecades } from '@/components/atlas/discovery-model';
import { SeasonBrowser } from '@/components/atlas/season-browser';
import styles from '@/components/editorial/archive.module.css';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getData, type Season } from '@/lib/api';
import { localizedMetadata } from '@/i18n/metadata';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('seasonsTitle');
export default async function Seasons() {
  const t = await getTranslations('UI');
  const locale = await getLocale() as 'uk' | 'en';
  const seasons = await getData<Season>('/api/seasons');
  const a = archiveCopy[locale];
  const decades = seasonDecades(seasons);
  const latest = [...seasons].sort((a, b) => b.year - a.year).slice(0, 3);
  return <section className={`page ${styles.page}`} data-testid="season-index">
    <EditorialHero title={t('seasonsTitle')} eyebrow={a.index} lead={a.seasonLead}
      media={<ArchivePlate marker={seasons.length ? String(Math.min(...seasons.map(row => row.year))) : '—'} label={a.years} note={a.scope}
        entries={latest.map(row => ({ id: String(row.year), href: `/seasons/${row.year}`, title: t('seasonTitle', { year: row.year }), meta: a.calendar }))} />}
      statistics={[{ label: t('seasons'), value: seasons.length }, { label: a.decade, value: decades.length }]}
      actions={<a href="#season-decades">{a.decade} ↓</a>} />
    <SourceAttribution locale={locale} />
    {seasons.length ? <>
      <section className={styles.chapter} aria-labelledby="season-decades">
        <SectionHeading kicker={a.decade} title={a.seasons} id="season-decades" />
        <SeasonBrowser seasons={seasons} locale={locale} />
      </section>
      <section className={styles.eraIndex} aria-labelledby="all-seasons">
        <SectionHeading kicker={a.index} title={a.archive} id="all-seasons" />
        <nav className={styles.eraJump} aria-label={a.decade}>{decades.map(({ decade }) => <a href={`#decade-${decade}`} key={decade}>{decade}{locale === 'uk' ? '-ті' : 's'}</a>)}</nav>
        {decades.map(({ decade, years }) => <section id={`decade-${decade}`} className={styles.decade} key={decade} aria-labelledby={`decade-title-${decade}`}>
          <h3 id={`decade-title-${decade}`}>{decade}<small>{years.length} {t('seasons')}</small></h3>
          <div className={styles.yearLinks}>{years.map(year => <Link key={year} href={`/seasons/${year}`}>{year}<span aria-hidden="true">↗</span></Link>)}</div>
        </section>)}
      </section>
    </> : <p>{t('noSeasons')}</p>}
  </section>;
}
