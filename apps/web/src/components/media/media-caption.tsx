import type { MediaAsset } from './registry';
import styles from './media.module.css';

export function MediaCaption({ asset, locale }: { asset: MediaAsset; locale: 'uk' | 'en' }) {
  const uk = locale === 'uk';
  const kinds = { photograph: ['Фотографія', 'Photograph'], portrait: ['Портрет', 'Portrait'], 'car-illustration': ['Ілюстрація боліда', 'Car illustration'], 'circuit-diagram': ['Схема траси', 'Circuit diagram'] };
  return <figcaption className={styles.caption}>
    {asset.ai_generated && <p className={styles.kind}>{uk ? 'Згенерована ШІ ілюстрація · не архівна фотографія' : 'AI-generated illustration · not archival photography'}</p>}
    <p className={styles.kind}>{kinds[asset.kind][uk ? 0 : 1]}{asset.historical_context.year && ` / ${asset.historical_context.year}`}</p>
    <p>{asset.caption[locale]}</p>
    <p>{asset.attribution} · <a href={asset.license.url!} rel="noreferrer">{asset.license.identifier}</a></p>
    <div className={styles.links}><a href={asset.source_url!} rel="noreferrer">{uk ? 'Першоджерело' : 'Original source'}</a><a href={asset.file_page_url} rel="noreferrer">{uk ? 'Сторінка файлу' : 'File record'}</a></div>
    <details><summary>{uk ? 'Умови використання' : 'Reuse conditions'}</summary>
      <p>{asset.historical_context.description}</p>
      <a href={asset.historical_context.source_url!} rel="noreferrer">{uk ? 'Джерело історичного контексту' : 'Historical context source'}</a>
      <p>{uk ? 'Зміни' : 'Changes'}: {asset.modifications}</p>
      {asset.license.restrictions.length > 0 && <ul>{asset.license.restrictions.map((note, i) => <li key={i}>{note}</li>)}</ul>}
    </details>
  </figcaption>;
}
