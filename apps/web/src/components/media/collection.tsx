import { LicensedMedia } from './licensed-media';
import { selectMediaCollection, type MediaAsset, type MediaSubject } from './registry';
import styles from './collection.module.css';
import { mediaCollectionCopy } from './collection-copy';
export function MediaCollection({assets,subject,label,locale,asOf}:{assets:readonly MediaAsset[];subject:MediaSubject;label:string;locale:'uk'|'en';asOf?:string}){
 const t=mediaCollectionCopy[locale];const eligible=selectMediaCollection(assets,subject,asOf);const shown=eligible.slice(0,6);const heading=`${subject.type}-${subject.id}-media-title`;
 return <section className={styles.collection} aria-labelledby={heading} data-testid="media-collection" data-media-subject={`${subject.type}:${subject.id}`}>
  <header><p>{t.kicker}</p><h3 id={heading}>{t[subject.type]}</h3><p>{t.note}</p></header>
  {shown.length?<><p className={styles.count}>{t.count}: {eligible.length} · {t.shown}: {shown.length}</p><div className={styles.gallery}>{shown.map(asset=><LicensedMedia key={asset.id} assets={assets} assetId={asset.id} subject={subject} label={label} locale={locale} asOf={asOf}/>)}</div></>
   :<aside className={styles.empty} data-testid="editorial-empty-media"><span aria-hidden="true">[ — ]</span><div><h4>{t.empty}</h4><p>{t.emptyNote}</p></div></aside>}
  <a className={styles.source} href={`/${locale}/sources`}>{t.source} ↗</a>
 </section>;
}
