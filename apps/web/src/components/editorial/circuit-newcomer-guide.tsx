import { Link } from '@/i18n/navigation';
import styles from './circuit-newcomer-guide.module.css';

type HistoricEvent = {
  race_id: string;
  season_year: number;
  race_name: string;
  winners: { driver_id: string; driver_name: string }[];
};
type Props = { locale: 'en' | 'uk'; circuitName: string; history: HistoricEvent[]; layoutCount: number };

export function CircuitNewcomerGuide({ locale, circuitName, history, layoutCount }: Props) {
  const sorted = [...history].sort((a, b) => a.season_year - b.season_year);
  const earliest = sorted[0];
  const latest = sorted.at(-1);
  const debutWinner = earliest?.winners[0];
  const uk = locale === 'uk';
  return <section className={styles.guide} data-testid="circuit-newcomer-guide" aria-labelledby="circuit-newcomer-title">
    <div className={styles.intro}>
      <p className={styles.eyebrow}>{uk ? 'Новачок у Формулі-1? Почни тут' : 'New to Formula 1? Start here'}</p>
      <h2 id="circuit-newcomer-title">{uk ? 'Чому ця траса важлива?' : 'Why does this circuit matter?'}</h2>
      <p>{uk
        ? `Траса ${circuitName} — це не лише карта поворотів. Кожен Гран-прі додає до її історії нових переможців, суперництво й зміни конфігурації. Ось три способи розпочати знайомство.`
        : `${circuitName} is more than a map of corners. Every Grand Prix adds winners, rivalries and sometimes a different layout to its story. Start with these three ways to explore.`}</p>
    </div>
    <div className={styles.cards}>
      <article className={styles.card}>
        <span className={styles.step}>01</span>
        <h3>{uk ? 'З чого все почалося?' : 'Where did it begin?'}</h3>
        {earliest ? <>
          <p>{uk ? `Перший Гран-прі, який ми маємо в архіві: ${earliest.season_year}. Це не обов’язково перша гонка на трасі.` : `Our earliest recorded World Championship Grand Prix is from ${earliest.season_year}. That is not necessarily the circuit’s first-ever race.`}</p>
          <Link href={`/races/${earliest.race_id}`}>{earliest.race_name} ↗</Link>
        </> : <p>{uk ? 'Поки немає підтверджених подій у нашому архіві.' : 'No archived events are available yet.'}</p>}
      </article>
      <article className={styles.card}>
        <span className={styles.step}>02</span>
        <h3>{uk ? 'Хто тут перемагав?' : 'Who has won here?'}</h3>
        {debutWinner ? <>
          <p>{uk ? `Перше місце в найдавнішому Гран-прі цього архіву: ${debutWinner.driver_name}. Дослідіть кар’єру пілота.` : `Our earliest recorded Grand Prix includes a first-position result for ${debutWinner.driver_name}. Follow their career story.`}</p>
          <Link href={`/drivers/${debutWinner.driver_id}`}>{debutWinner.driver_name} ↗</Link>
        </> : <p>{uk ? 'Переглянь результати, щоб знайти задокументовані виступи.' : 'Explore the results to discover documented performances.'}</p>}
      </article>
      <article className={styles.card}>
        <span className={styles.step}>03</span>
        <h3>{uk ? 'Чи змінювалася траса?' : 'Has the circuit changed?'}</h3>
        <p>{uk
          ? layoutCount > 1 ? `В архіві є ${layoutCount} конфігурацій. Порівняй їх, перш ніж зіставляти рекорди різних років.` : 'Переглянь доступну схему. Не варто порівнювати часи різних років без перевірки конфігурації.'
          : layoutCount > 1 ? `The archive contains ${layoutCount} layouts. Compare them before comparing lap times across eras.` : 'Look at the available map. Lap times from different eras should not be compared without checking the layout.'}</p>
        <a href="#circuit-layouts">{uk ? 'Дослідити конфігурації' : 'Explore layouts'} ↓</a>
      </article>
    </div>
    {latest && earliest && latest.season_year !== earliest.season_year && <p className={styles.footnote}>{uk
      ? `Наші записи охоплюють сезони ${earliest.season_year}–${latest.season_year}. Майбутні етапи в архіві не означають, що перегони вже відбулися.`
      : `Our records span ${earliest.season_year}–${latest.season_year}. A scheduled future event in the archive does not mean the race has happened.`}</p>}
  </section>;
}
