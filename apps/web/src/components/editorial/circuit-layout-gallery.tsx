import { CIRCUIT_ARTWORK } from '@/components/circuit-layout-registry';
import styles from './circuit-layout-gallery.module.css';

type Layout = { external_layout_id: string; effective: boolean };
export function CircuitLayoutGallery({ layouts, title, locale }: { layouts: readonly Layout[]; title: string; locale: 'en' | 'uk' }) {
  const seen = new Set<string>();
  const artwork = layouts.flatMap(layout => {
    if (seen.has(layout.external_layout_id)) return [];
    seen.add(layout.external_layout_id);
    const image = CIRCUIT_ARTWORK.get(layout.external_layout_id);
    return image ? [{ ...image, effective: layout.effective }] : [];
  });
  if (!artwork.length) return null;
  return <section className={styles.section} aria-labelledby="circuit-artwork-gallery-title" data-testid="circuit-artwork-gallery">
    <header><p className={styles.kicker}>{locale === 'uk' ? 'КАРТОГРАФІЯ / АРХІВ' : 'CARTOGRAPHY / ARCHIVE'}</p>
      <h2 id="circuit-artwork-gallery-title">{locale === 'uk' ? 'Історичні конфігурації' : 'Historical circuit layouts'}</h2>
      <p>{locale === 'uk' ? 'Кожен контур відповідає конкретному ідентифікатору конфігурації в архіві, а не всій історії траси.' : 'Each outline corresponds to a specific archived layout ID, not the circuit’s entire history.'}</p>
    </header>
    <div className={styles.grid}>{artwork.map(asset => <figure className={styles.card} key={asset.layout_id}>
      <div className={styles.canvas}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.path} width={360} height={300} loading="lazy" alt={locale === 'uk' ? `Схема конфігурації ${asset.layout_id} траси ${title}` : `Outline of ${title} layout ${asset.layout_id}`} />
      </div>
      <figcaption><strong>{asset.layout_id}</strong>
        {asset.effective && <span className={styles.tag}>{locale === 'uk' ? 'Чинна в архіві' : 'Effective in archive'}</span>}
        <span className={styles.credit}><a href={asset.source_url} target="_blank" rel="noopener noreferrer">{asset.author} ↗</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{asset.license}</a></span>
      </figcaption>
    </figure>)}</div>
  </section>;
}
