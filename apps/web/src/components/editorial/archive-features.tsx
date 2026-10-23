import { getData, type CatalogueEntity } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { CareerSignature } from '@/components/atlas/career-signature';
import { featuredIdentities } from '@/components/atlas/discovery-model';
import { SectionHeading } from './primitives';
import { archiveCopy } from './archive-copy';
import styles from './archive.module.css';

const selections = { drivers: ['juan-manuel-fangio', 'ayrton-senna', 'lewis-hamilton'], constructors: ['ferrari', 'mclaren', 'williams'], circuits: ['monaco', 'silverstone', 'suzuka'] };
type Profile = { first_season: number | null; last_season: number | null; races?: number; starts?: number; wins?: number };
type Season = { year: number; starts?: number; races?: number; wins: number };

/** Optional streamed discovery. Only archive fetches are caught, never rendering. */
export async function ArchiveFeatures({ kind, fallback, locale }: { kind: keyof typeof selections; fallback: CatalogueEntity[]; locale: 'uk' | 'en' }) {
  const t = archiveCopy[locale];
  const matches = await Promise.allSettled(selections[kind].map(id => getData<CatalogueEntity>(`/api/${kind}?q=${id}&limit=5`)));
  if (matches.some(result => result.status === 'rejected')) return <p role="status" className={styles.unavailable}>{t.unavailable}</p>;
  const selected = featuredIdentities(matches.map((result, index) => result.status === 'fulfilled' ? result.value.find(row => row.external_id === selections[kind][index]) : undefined), fallback);
  if (!selected.length) return null;
  const previews = await Promise.all(selected.map(async entity => {
    const result = await Promise.allSettled([
      getData<Profile>(`/api/${kind}/${entity.id}`),
      kind === 'circuits' ? Promise.resolve([]) : getData<Season>(`/api/${kind}/${entity.id}/seasons`),
    ]);
    return { entity, result };
  }));
  return <section className={styles.features} aria-labelledby="archive-featured" data-testid="archive-features">
    <SectionHeading kicker={t.index} title={t.selected} note={t.selectedNote} id="archive-featured" />
    <div className={styles.featureGrid}>{previews.map(({ entity, result }, index) => {
      const profile = result[0].status === 'fulfilled' ? result[0].value[0] as Profile | undefined : undefined;
      const seasons = result[1].status === 'fulfilled' ? result[1].value as Season[] : [];
      return <article className={styles.feature} key={entity.id}>
        <p className={styles.label}>{String(index + 1).padStart(2, '0')} / {entity.external_id}</p>
        <h3><Link href={`/${kind}/${entity.id}`}>{entity.name}</Link></h3>
        {profile ? <><p className={styles.featureYears}>{profile.first_season ?? '—'}{profile.last_season !== profile.first_season && `—${profile.last_season ?? '—'}`}</p>
          <dl><div><dt>{kind === 'drivers' ? (locale === 'uk' ? 'Записи результатів' : 'Result entries') : t.races}</dt><dd>{profile.races ?? profile.starts ?? '—'}</dd></div>
            {profile.wins !== undefined && <div><dt>{t.wins}</dt><dd>{profile.wins}</dd></div>}</dl></> : null}
        {result.some(row => row.status === 'rejected') && <p role="status" className={styles.note}>{t.unavailable}</p>}
        {kind === 'drivers' && seasons.length > 0 && <CareerSignature seasons={seasons.map(row => ({ ...row, starts: row.starts ?? 0, podiums: 0, points: null, points_missing: 0 }))} name={entity.name} locale={locale} />}
        {kind === 'constructors' && seasons.length > 0 && <nav className={styles.eraJump} aria-label={`${entity.name} / ${t.years}`}>
          {[...new Set([Math.min(...seasons.map(row => row.year)), Math.max(...seasons.map(row => row.year))])].map(year => <Link key={year} href={`/constructors/${entity.id}?season=${year}`}>{year} ↗</Link>)}
        </nav>}
        <Link href={`/${kind}/${entity.id}`}>{t.open} ↗</Link>
      </article>;
    })}</div><p className={styles.note}>{t.scope}</p>
  </section>;
}
