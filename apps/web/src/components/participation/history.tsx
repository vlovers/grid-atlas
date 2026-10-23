import type { Participation } from '@/components/driver/showcase-model';
import { participationHistory, evidencePath } from './model';
import { participationCopy } from './copy';
import styles from './history.module.css';

type Props={kind:'driver'|'constructor';id:string;name:string;rows:readonly Participation[];seasons:readonly number[];selectedYear?:number;locale:'uk'|'en'};

/** Server-rendered calendar and native links: useful before hydration and without JS. */
export function ParticipationHistory({kind,id,name,rows,seasons,selectedYear,locale}:Props){
 const t=participationCopy[locale];const model=participationHistory(rows,seasons,selectedYear);
 const anchor=kind==='driver'?'driver-era-rail':'constructor-lineup-timeline';
 const destination=kind==='driver'?'driver-era-rail':'constructor-season';
 const yearPath=(year:number)=>`/${locale}/${kind==='driver'?'drivers':'constructors'}/${id}?season=${year}#${destination}`;
 const relatedPath=(relatedId:string)=>`/${locale}/${kind==='driver'?'constructors':'drivers'}/${relatedId}`;
 const period=(years:number[])=>years.length===1?String(years[0]):`${years[0]}–${years.at(-1)}`;
 const n=(value:number)=>new Intl.NumberFormat(locale).format(value);
 const changes=model.changes;
 return <section id={anchor} className={styles.history} aria-labelledby={`${anchor}-title`} data-testid={anchor}>
  <header className={styles.heading}><div><p className={styles.kicker}>{t.kicker}</p><h3 id={`${anchor}-title`}>{kind==='driver'?t.driverTitle:t.constructorTitle}</h3></div><p>{kind==='driver'?t.driverLead:t.constructorLead}</p></header>
  {model.selected!==undefined&&<nav className={styles.navigation} aria-label={t.seasons}>
   {model.previous!==null?<a href={yearPath(model.previous)} aria-label={`${t.previous}: ${model.previous}`}>← {model.previous}</a>:<span aria-hidden="true">—</span>}
   <p><span>{t.selected}</span><strong>{model.selected}</strong></p>
   {model.next!==null?<a href={yearPath(model.next)} aria-label={`${t.next}: ${model.next}`}>{model.next} →</a>:<span aria-hidden="true">—</span>}
  </nav>}
  {model.series.length?<>
   <p className={styles.note} id={`${anchor}-scroll-help`}>{t.scroll}</p>
   <div className={styles.scroll} role="region" tabIndex={0} aria-label={t.matrix} aria-describedby={`${anchor}-scroll-help`}>
    <table className={styles.matrix} style={{minWidth:`${190+model.calendar.length*76}px`}}>
     <caption>{t.window}: {model.calendar[0]}–{model.calendar.at(-1)} · {name}</caption>
     <thead><tr><th scope="col">{kind==='driver'?t.relatedConstructor:t.relatedDriver}</th>{model.calendar.map(year=><th key={year} scope="col" data-selected={year===model.selected}>
      {model.years.includes(year)?<a href={yearPath(year)} aria-current={year===model.selected?'page':undefined}>{year}</a>:<span title={t.missingSeason}>{year}</span>}
     </th>)}</tr></thead>
     <tbody>{model.series.map(series=><tr key={series.id}>
      <th scope="row"><a href={relatedPath(series.id)}>{series.name} <span aria-hidden="true">↗</span></a><small>{series.periods.map(era=>period(era.years)).join(' · ')}</small></th>
      {series.cells.map(cell=><td key={cell.year} data-selected={cell.year===model.selected}>
       {cell.rows.length?<a className={styles.mark} data-start={!series.periods.some(period=>period.years.includes(cell.year-1))} data-end={!series.periods.some(period=>period.years.includes(cell.year+1))}
        href={evidencePath(locale,kind,id,series.id,cell.year)} aria-label={`${series.name} · ${cell.year} · ${t.recorded}: ${n(cell.rows.reduce((sum,row)=>sum+row.races,0))} · ${t.evidence}`}>
        <span aria-hidden="true" className={styles.line}/><strong>{n(cell.rows.reduce((sum,row)=>sum+row.races,0))}</strong>
       </a>:<span className={styles.missing}><span aria-hidden="true">{cell.recorded?'·':'—'}</span><span className={styles.srOnly}>{cell.recorded?t.noAssociation:t.missingSeason}</span></span>}
      </td>)}
     </tr>)}</tbody>
    </table>
   </div>
   <p className={styles.legend}><span>{t.legend}</span><span><i aria-hidden="true"/>{t.recorded}</span><span>· {t.noAssociation}</span><span>— {t.missingSeason}</span></p>
  </>:<p className={styles.empty}>{t.empty}</p>}
  <p className={styles.note}>{t.note}</p>
  {model.years.length>0&&<details className={styles.allYears}><summary>{t.all} <span>{n(model.years.length)}</span></summary><nav aria-label={t.all}>{model.years.map(year=><a key={year} href={yearPath(year)}>{year}</a>)}</nav></details>}
  {model.selected!==undefined&&<section className={styles.changes} aria-labelledby={`${anchor}-changes`} data-testid="participation-changes" data-comparison={changes.state}>
   <header><h4 id={`${anchor}-changes`}>{t.changes}</h4><span>{changes.previousYear??'—'} → {model.selected}</span></header>
   {changes.state==='available'?<><dl>{(['added','retained','absent'] as const).map(key=><div key={key}><dt>{t[key]}</dt><dd>{changes[key].length?<ul>{changes[key].map(entity=><li key={entity.id}><a href={relatedPath(entity.id)}>{entity.name} ↗</a></li>)}</ul>:t.none}</dd></div>)}</dl><p>{t.changesNote}</p></>:<p>{t[changes.state]}</p>}
  </section>}
  {model.eras.length>0&&<details className={styles.periods}><summary>{t.boundaries} <span>{n(model.eras.length)}</span></summary><ol>{model.eras.map(era=><li key={era.key}>
   <div><span className={styles.period}>{period(era.years)}</span><h4><a href={relatedPath(era.id)}>{era.name} ↗</a></h4></div>
   <a href={`/${locale}/races/${era.rows[0].first_race.id}`}>{t.firstRace}: {era.rows[0].first_race.name} ↗</a>
   <a href={`/${locale}/races/${era.rows.at(-1)!.last_race.id}`}>{t.lastRace}: {era.rows.at(-1)!.last_race.name} ↗</a>
  </li>)}</ol></details>}
  <footer>{t.source} · <a href={`/${locale}/sources`}>{locale==='uk'?'Джерела':'Sources'} ↗</a></footer>
 </section>;
}
