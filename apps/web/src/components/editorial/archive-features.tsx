import { getData, type CatalogueEntity } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { featuredIdentities } from '@/components/atlas/discovery-model';
import { SectionHeading } from './primitives';
import { archiveCopy } from './archive-copy';
import styles from './archive.module.css';

const selections = { drivers: ['juan-manuel-fangio', 'ayrton-senna', 'lewis-hamilton'], constructors: ['ferrari', 'mclaren', 'williams'], circuits: ['monaco', 'silverstone', 'suzuka'] };
type Profile = { first_season: number | null; last_season: number | null; races?: number; starts?: number; wins?: number };

/** Optional streamed discovery. Only archive fetches are caught, never rendering. */
export async function ArchiveFeatures({ kind, fallback, locale }: { kind: keyof typeof selections; fallback: CatalogueEntity[]; locale: 'uk' | 'en' }) {
  const t = archiveCopy[locale];
  const matches = await Promise.allSettled(selections[kind].map(id => getData<CatalogueEntity>(`/api/${kind}?q=${id}&limit=5`)));
  if (matches.some(result => result.status === 'rejected')) return <p role="status" className={styles.unavailable}>{t.unavailable}</p>;
  const selected = featuredIdentities(matches.map((result, index) => result.status === 'fulfilled' ? result.value.find(row => row.external_id === selections[kind][index]) : undefined), fallback);
  if (!selected.length) return null;
  const previews = await Promise.all(selected.map(async entity => ({ entity,
    result: await Promise.allSettled([getData<Profile>(`/api/${kind}/${entity.id}`)]),
  })));
  return <section className={styles.features} aria-labelledby="archive-featured" data-testid="archive-features">
    <SectionHeading kicker={t.index} title={t.selected} note={t.selectedNote} id="archive-featured" />
    <div className={styles.featureGrid}>{previews.map(({ entity, result }, index) => {
      const profile = result[0].status === 'fulfilled' ? result[0].value[0] as Profile | undefined : undefined;
      return <article className={styles.feature} key={entity.id}>
        <p className={styles.label}>{String(index + 1).padStart(2, '0')} / {entity.external_id}</p>
        <h3><Link href={`/${kind}/${entity.id}`}>{entity.name}</Link></h3>
        {profile ? <><p className={styles.featureYears}>{profile.first_season ?? '—'}{profile.last_season !== profile.first_season && `—${profile.last_season ?? '—'}`}</p>
          <dl><div><dt>{t.races}</dt><dd>{entity.races ?? profile.races ?? '—'}</dd></div>
            {entity.wins !== undefined && <div><dt>{t.wins}</dt><dd>{entity.wins}</dd></div>}</dl></> : null}
        {result.some(row => row.status === 'rejected') && <p role="status" className={styles.note}>{t.unavailable}</p>}
        <Link href={`/${kind}/${entity.id}`}>{t.open} ↗</Link>
      </article>;
    })}</div>
  </section>;
}
