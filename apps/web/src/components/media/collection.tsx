import { MediaGallery } from './gallery';
import { selectMediaCollection, type MediaAsset, type MediaSubject } from './registry';
import styles from './collection.module.css';
import { mediaCollectionCopy } from './collection-copy';
export function MediaCollection({assets,subject,label,locale,asOf}:{assets:readonly MediaAsset[];subject:MediaSubject;label:string;locale:'uk'|'en';asOf?:string}){
 const t=mediaCollectionCopy[locale];const eligible=selectMediaCollection(assets,subject,asOf);const shown=eligible;const heading=`${subject.type}-${subject.id}-media-title`;
 if (!shown.length) return <details className={styles.compact} data-testid="media-collection" data-media-subject={`${subject.type}:${subject.id}`}>
  <summary>{locale === 'uk' ? 'Фотоархів' : 'Image archive'}</summary>
  <div data-testid="editorial-empty-media"><p>{t.empty}</p><p>{t.emptyNote}</p><a className={styles.source} href={`/${locale}/sources`}>{t.source} ↗</a></div>
 </details>;
 return <section className={styles.collection} aria-labelledby={heading} data-testid="media-collection" data-media-subject={`${subject.type}:${subject.id}`}>
  <header><p>{t.kicker}</p><h3 id={heading}>{t[subject.type]}</h3><p>{t.note}</p></header>
  <p className={styles.count}>{t.count}: {eligible.length}</p>
  <MediaGallery assets={shown} label={label} locale={locale} />
  <a className={styles.source} href={`/${locale}/sources`}>{t.source} ↗</a>
 </section>;
}
