import facts from './circuit-extra-stories.json';
import nextFacts from './circuit-next20-stories.json';
import styles from './circuit-history-stories.module.css';
type Entry = {id:string;title:{en:string;uk:string};description:{en:string;uk:string};year:string;source:string};
const entries = [...facts, ...nextFacts] as Entry[];
export function CircuitExtraStories({circuitId, locale}:{circuitId:string;locale:'en'|'uk'}) {
  const item=entries.find(x=>x.id===circuitId);
  if(!item)return null;
  return <section className={styles.story} data-testid="circuit-extra-story" aria-labelledby="circuit-extra-story-title">
    <p className={styles.kicker}>{locale==='uk'?'Історія траси':'Circuit history'}</p>
    <p className={styles.review}>{locale==='uk'?'Перевірено за допомогою ШІ · Незалежна редакторська перевірка ще не завершена':'AI-reviewed · Independent editorial verification pending'}</p>
    <h2 id="circuit-extra-story-title">{item.title[locale]}</h2>
    <p className={styles.introduction}>{item.description[locale]}</p>
    <p className={styles.explore}><strong>{item.year}</strong> · <a href={item.source} target="_blank" rel="noopener noreferrer">{locale==='uk'?'Джерело: історичний архів F1DB / Formula 1':'Source: historical F1DB / Formula 1 archive'} ↗</a></p>
  </section>;
}
