import { ParticipationHistory } from '@/components/participation/history';
import { raceMoments, type DriverCareer, type DriverSeason } from './showcase-model';
import { showcaseCopy } from './showcase-copy';
import styles from '@/components/participation/history.module.css';

/** Shared source model and visual language with the constructor lineup timeline. */
export function CareerEraRail({career,seasons,driverId,name,locale,selectedYear}:{career:DriverCareer|null;seasons:DriverSeason[];driverId:string;name:string;locale:'uk'|'en';selectedYear?:number}) {
 const moments=career?raceMoments(career.milestones):[];const t=showcaseCopy[locale];
 return <>
  {moments.length>0&&<aside className={styles.milestones} aria-labelledby="career-milestones-title" data-testid="career-milestone-chronology">
   <h3 id="career-milestones-title">{locale==='uk'?'Віхи за гоночними записами':'Milestones in the race record'}</h3>
   <ol>{moments.map(moment=><li key={moment.race.id}><a href={`/${locale}/races/${moment.race.id}`}>
    <time dateTime={String(moment.race.year)}>{moment.race.year}</time><small>{moment.labels.map(label=>t[label]).join(' / ')}</small><strong>{moment.race.name} ↗</strong>
   </a></li>)}</ol>
  </aside>}
  <ParticipationHistory kind="driver" id={driverId} name={name} rows={career?.participation??[]} seasons={seasons.map(season=>season.year)} selectedYear={selectedYear} locale={locale}/>
 </>;
}
