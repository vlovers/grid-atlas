import { getData, type CatalogueEntity } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { featuredIdentities } from '@/components/atlas/discovery-model';
import { selectCircuitCoverArtwork } from '@/components/circuit-layout-registry';
import { SectionHeading } from './primitives';
import styles from './circuit-catalogue-features.module.css';

export async function CircuitCatalogueFeatures({ fallback, locale }: { fallback: CatalogueEntity[]; locale: 'uk' | 'en' }) {
  const names = ['monaco', 'spa-francorchamps', 'suzuka'];
  const matches = await Promise.all(names.map(name => getData<CatalogueEntity>(`/api/circuits?q=${name}&limit=5`)));
  const selected = featuredIdentities(matches.map((rows, index) => rows.find(row => row.external_id === names[index])), fallback);
  const records = await Promise.all(selected.map(async entity => {
    const [profiles, layouts] = await Promise.all([
      getData<{ races: number; first_season: number | null; last_season: number | null }>(`/api/circuits/${entity.id}`),
      getData<{ external_layout_id: string; effective: boolean }>(`/api/circuits/${entity.id}/layouts`),
    ]);
    return { entity, profile: profiles[0], artwork: selectCircuitCoverArtwork(layouts) };
  }));
  const uk = locale === 'uk';
  return <section className={styles.section} data-testid="archive-features" aria-labelledby="circuit-catalogue-selection">
    <SectionHeading id="circuit-catalogue-selection" kicker={uk ? 'ТРАСИ У ФОКУСІ' : 'CIRCUIT SPOTLIGHT'} title={uk ? 'Три різні характери' : 'Three different characters'} />
    <div className={styles.grid}>{records.map(({ entity, profile, artwork }) => <article key={entity.id}>
      <h3><Link href={`/circuits/${entity.id}`}>{entity.name}</Link></h3>
      <p>{profile?.first_season ?? '—'}–{profile?.last_season ?? '—'} · {profile?.races ?? '—'} GP</p>
      {artwork && <figure>{/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artwork.path} width={500} height={500} loading="lazy" alt={`${entity.name} · ${artwork.layout_id}`} />
        <figcaption><a href={artwork.source_url}>{artwork.author}</a> · <a href="https://creativecommons.org/licenses/by/4.0/">{artwork.license}</a> · {artwork.layout_id}</figcaption>
      </figure>}
      <Link className={styles.action} href={`/circuits/${entity.id}`}>{uk ? 'Історія траси' : 'Explore the circuit'} ↗</Link>
    </article>)}</div>
  </section>;
}
