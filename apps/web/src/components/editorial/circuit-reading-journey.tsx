import { Link } from '@/i18n/navigation';
import type { CircuitReadingModel } from './circuit-reader-model';
import styles from './circuit-reading-journey.module.css';

type Props = { model: CircuitReadingModel; circuitId: string; name: string; locale: 'en' | 'uk' };
const layoutHref = (id: string, race: string) => `/circuits/${id}?race=${encodeURIComponent(race)}#circuit-layouts`;

export function CircuitRecordIntroduction({ model, name, locale }: Omit<Props, 'circuitId'>) {
  const uk = locale === 'uk';
  const first = model.records[0]?.race, last = model.records.at(-1)?.race;
  const plural = new Intl.PluralRules('uk');
  const seasonForm = plural.select(model.years.length), layoutForm = plural.select(model.chapters.length);
  const seasons = uk ? (seasonForm === 'one' ? 'сезон' : seasonForm === 'few' ? 'сезони' : 'сезонів')
    : model.years.length === 1 ? 'recorded season' : 'recorded seasons';
  const configurations = uk ? (layoutForm === 'one' ? 'конфігурація' : layoutForm === 'few' ? 'конфігурації' : 'конфігурацій')
    : model.chapters.length === 1 ? 'configuration' : 'configurations';
  return <div className={styles.introduction} data-testid="circuit-record-introduction">
    <p className={styles.kicker}>{uk ? 'ІСТОРІЯ В ЗАПИСАХ' : 'A HISTORY IN THE RECORDS'}</p>
    <h2>{uk ? 'Одна траса. Різні епохи.' : 'One circuit. Different eras.'}</h2>
    {first && last ? <p className={styles.lead}>{uk
      ? `${name}: архів починається з гонки ${first.season_year} року${first.race_id !== last.race_id ? ` і продовжується до запису ${last.season_year} року` : ''}. У ньому — ${model.years.length} ${seasons} і ${model.chapters.length} ${configurations} зі зв’язком із конкретними Гран-прі.`
      : `${name}: the archive opens with a race in ${first.season_year}${first.race_id !== last.race_id ? ` and continues to a record in ${last.season_year}` : ''}. It spans ${model.years.length} ${seasons} and ${model.chapters.length} ${configurations} linked to individual Grands Prix.`}</p>
      : <p>{uk ? 'Для цієї траси ще немає пов’язаних записів гонок. Це не доводить відсутності перегонів у її історії.' : 'No linked race records are available for this circuit. That does not establish an absence of racing in its history.'}</p>}
    <p>{uk ? 'Цей огляд побудовано з архівних записів, а не з редакційної оцінки подій. Біографії, назви поворотів і пояснення причин потребують окремого схвалення.' : 'This overview follows archive records, rather than an editorial interpretation of events. Biographies, corner names and explanations of causes require separate review.'}</p>
  </div>;
}

export function CircuitReadingJourney({ model, circuitId, locale }: Props) {
  const uk = locale === 'uk';
  return <section id="circuit-race-journey" tabIndex={-1} aria-labelledby="circuit-race-journey-title" className={styles.journey} data-testid="circuit-reading-journey">
    <header><p className={styles.kicker}>{uk ? 'ЧИТАТИ КРІЗЬ ЕПОХИ' : 'READ ACROSS THE ERAS'}</p><h2 id="circuit-race-journey-title">{uk ? 'Від гонки до її конфігурації' : 'From a race to its layout'}</h2>
      <p>{uk ? 'Події позначають початок архіву, різні конфігурації та пізніші записи. Це шлях для дослідження, а не рейтинг найважливіших гонок.' : 'These events mark the beginning of the archive, different configurations and later records. This is a reading path, not a ranking of memorable races.'}</p></header>
    {model.journey.length ? <ol className={styles.cards}>{model.journey.map(({ race, layout }) => <li key={race.race_id} data-race-id={race.race_id}>
      <span className={styles.year}>{race.season_year}</span><h3><Link href={`/races/${race.race_id}`}>{race.race_name}</Link></h3>
      <p>{uk ? 'Переможці в результатах архіву' : 'Winners in the recorded results'}: {race.winners.length ? race.winners.map(winner =>
        <span key={`${winner.driver_id}:${winner.constructor_id}`} className={styles.winner}><Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> · <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></span>) : (uk ? 'немає запису' : 'not recorded')}</p>
      <Link className={styles.layoutLink} href={layoutHref(circuitId, race.race_id)}>{layout ? (uk ? 'Конфігурація цієї гонки' : 'This race’s configuration') : (uk ? 'Перевірити дані гонки' : 'Inspect the event record')} →</Link>
    </li>)}</ol> : <p>{uk ? 'Гонки з’являться тут після імпорту записів цього місця.' : 'Races will appear here when records for this venue are imported.'}</p>}
  </section>;
}

export function CircuitConfigurationChapters({ model, circuitId, locale }: Props) {
  const uk = locale === 'uk';
  return <section className={styles.chapters} aria-labelledby="configuration-chapters-title" data-testid="circuit-configuration-chapters">
    <h3 id="configuration-chapters-title">{uk ? 'Розділи історії конфігурацій' : 'Chapters in the layout record'}</h3>
    <p>{uk ? 'Перші й останні зафіксовані події для кожного ідентифікатора. Проміжок між ними не доводить безперервного використання або незмінної геометрії.' : 'The first and last recorded events for each layout identity. The interval does not prove continuous use or unchanged geometry.'}</p>
    {model.chapters.length ? <ol>{model.chapters.map(chapter => <li key={chapter.layout.id}>
      <span className={styles.year}>{chapter.first.race.season_year}{chapter.last.race.season_year !== chapter.first.race.season_year ? `–${chapter.last.race.season_year}` : ''}</span>
      <div><h4>{chapter.layout.external_layout_id}</h4><p>{uk ? 'Пов’язані записи гонок' : 'Linked race records'}: {chapter.observations.length}</p>
        <Link href={layoutHref(circuitId, chapter.first.race.race_id)}>{uk ? 'Дослідити перший запис' : 'Explore its first record'} →</Link></div>
    </li>)}</ol> : <p>{uk ? 'Немає конфігурацій із підтвердженим зв’язком із записами гонок.' : 'No layout has an exact link to the available race records.'}</p>}
  </section>;
}

/** Original data illustration: individual recorded seasons, never circuit geometry. */
export function CircuitRecordCover({ model, locale }: { model: CircuitReadingModel; locale: 'en' | 'uk' }) {
  const uk = locale === 'uk';
  const first = model.years[0], last = model.years.at(-1);
  const span = Math.max(1, (last ?? 0) - (first ?? 0));
  return <figure className={styles.recordCover} data-testid="circuit-record-cover">
    <p>{uk ? 'СЛІДИ СЕЗОНІВ' : 'A TRACE OF THE SEASONS'}</p>
    <strong>{first ?? '—'}</strong>
    <svg viewBox="0 0 500 100" role="img" aria-label={uk ? 'Кожна риска — сезон із записом гонки у F1DB' : 'Each mark is a season with a race record in F1DB'}>
      <path d="M10 80H490" fill="none" stroke="currentColor" opacity=".25" />
      {model.years.map(year => <path key={year} d={`M${10 + (year - first) / span * 480} 80v-45`} fill="none" stroke="currentColor" strokeWidth="3" />)}
    </svg>
    <figcaption>{first ?? '—'}–{last ?? '—'} · {uk ? 'Сезони з гонками в архіві; це не схема траси.' : 'Seasons with archived races; this is not a circuit map.'}</figcaption>
    <a href="#circuit-race-journey">{uk ? 'Дослідити епохи' : 'Explore the eras'} ↓</a>
  </figure>;
}
