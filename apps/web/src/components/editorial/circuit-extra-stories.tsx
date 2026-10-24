import { Link } from '@/i18n/navigation';
import facts from './circuit-extra-stories.json';
import nextFacts from './circuit-next20-stories.json';
import finalFacts from './circuit-final33-stories.json';
import styles from './circuit-history-stories.module.css';

type Entry = {
  id: string;
  title: { en: string; uk: string };
  description: { en: string; uk: string };
  year: string;
  source: string;
};
type Race = {
  race_id: string;
  season_year: number;
  race_name: string;
  winners: { driver_id: string; driver_name: string }[];
};
const entries = [...facts, ...nextFacts, ...finalFacts] as Entry[];
const byId = new Map(entries.map(entry => [entry.id, entry]));
const firstMentionedYear = (value: string) => {
  const year = value.match(/\b(19|20)\d{2}\b/);
  return year ? Number(year[0]) : null;
};

export function CircuitExtraStories({
  circuitId, locale, history = [],
}: { circuitId: string; locale: 'en' | 'uk'; history?: Race[] }) {
  const item = byId.get(circuitId);
  if (!item) return null;
  const uk = locale === 'uk';
  const year = firstMentionedYear(item.year);
  const race = year === null ? undefined : history.find(event => event.season_year === year);
  const winner = race?.winners[0];
  const sourceLabel = item.source.includes('github.com/f1db/f1db')
    ? (uk ? 'Протокол гонки · F1DB' : 'Race classification · F1DB')
    : (uk ? 'Джерело · Formula 1' : 'Source · Formula 1');
  return <section className={styles.story} data-testid="circuit-extra-story" aria-labelledby="circuit-extra-story-title">
    <p className={styles.kicker}>{uk ? 'Історія траси' : 'Circuit history'}</p>
    <p className={styles.review}>{uk
      ? 'Перевірено за допомогою ШІ · Незалежна редакторська перевірка ще не завершена'
      : 'AI-reviewed · Independent editorial verification pending'}</p>
    <h2 id="circuit-extra-story-title">{item.title[locale]}</h2>
    <p className={styles.introduction}>{item.description[locale]}</p>
    <div className={styles.storyNext} data-testid="circuit-story-explore">
      <p className={styles.storyNextEyebrow}>{uk ? 'Продовжити історію' : 'Follow the story'}</p>
      <div className={styles.storyNextLinks}>
        {race && <Link href={`/races/${race.race_id}`}>{uk ? 'Переглянути Гран-прі' : 'Explore the Grand Prix'} · {race.season_year}</Link>}
        {winner && <Link href={`/drivers/${winner.driver_id}`}>{uk ? 'Дізнатися про переможця' : 'Meet the winner'} · {winner.driver_name}</Link>}
        <a href="#circuit-layouts">{uk ? 'Побачити трасу на схемі' : 'See the circuit layout'} ↓</a>
      </div>
      <p className={styles.storySource}><strong>{item.year}</strong> · <a href={item.source} target="_blank" rel="noopener noreferrer">{sourceLabel} ↗</a></p>
      <p className={styles.review}>{uk
        ? 'Посилання на гонку показано лише тоді, коли рік історії збігається з подією в архіві. Протокол підтверджує результат, але не кожну подробицю оповіді.'
        : 'A Grand Prix link appears only when its year matches an archived event. Race classifications verify results, not every detail of the narrative.'}</p>
    </div>
  </section>;
}
