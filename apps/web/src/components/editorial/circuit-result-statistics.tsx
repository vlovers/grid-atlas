import { Link } from '@/i18n/navigation';
import { ArchiveTable } from './archive-table';
import type { CircuitReadingModel } from './circuit-reader-model';

/** Distinct imported winning races, including shared drives; never standings. */
export function CircuitResultStatistics({ model, locale }: { model: CircuitReadingModel; locale: 'en' | 'uk' }) {
  const uk = locale === 'uk';
  const tables = (metric: string, drivers: typeof model.driverWins, constructors: typeof model.constructorWins) =>
    <div className="circuit-statistics-grid">{(['drivers', 'constructors'] as const).map(kind => {
      const title = kind === 'drivers' ? (uk ? 'Пілоти' : 'Drivers') : (uk ? 'Конструктори' : 'Constructors');
      const rows = kind === 'drivers' ? drivers : constructors;
      return <div key={kind}><h3>{title}</h3>{rows.length
        ? <ArchiveTable label={title} locale={locale}><table data-testid={`circuit-${kind}-${metric}`}><thead><tr><th scope="col">{title}</th><th scope="col">{metric === 'wins' ? (uk ? 'Перемоги' : 'Wins') : (uk ? 'Гонки' : 'Races')}</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}><th scope="row"><Link href={`/${kind}/${row.id}`}>{row.name}</Link></th><td>{row.count}</td></tr>)}</tbody></table></ArchiveTable>
        : <p>{uk ? 'В архіві немає відповідних записів.' : 'No matching records are available in the archive.'}</p>}</div>;
    })}</div>;
  const sources = [...new Map(model.records.flatMap(({ race }) => race.classification_sources ?? [])
    .map(source => [`${source.source_locator}:${source.content_hash}`, source])).values()];
  return <section id="circuit-statistics" tabIndex={-1} aria-labelledby="circuit-statistics-title" data-testid="circuit-result-statistics">
    <h2 id="circuit-statistics-title">{uk ? 'Статистика траси' : 'Circuit statistics'}</h2>
    <p>{uk ? 'Кількість окремих гонок із перемогою в імпортованих результатах усіх конфігурацій. Спільна перемога зараховується кожному пілоту, а конструктору — один раз за гонку. Це не чемпіонські титули або офіційна статистика стартів.' : 'Distinct winning races in the imported results across all layouts. Shared victories count for each driver and once per constructor per race. These are not championship titles or official start totals.'}</p>
    {tables('wins', model.driverWins, model.constructorWins)}
    {([{ key: 'poles', title: uk ? 'Поул-позиції' : 'Pole positions', data: model.poles },
      { key: 'fastest-laps', title: uk ? 'Найшвидші кола' : 'Fastest laps', data: model.fastestLaps }]).map(metric =>
      <details key={metric.key} data-testid={`circuit-${metric.key}-statistics`}><summary>{metric.title}</summary>
        <p>{uk ? 'Повні позначки в результатах є для гонок' : 'Complete result flags are available for races'}: {metric.data.coveredRaces}/{model.records.length}. {uk ? 'Підсумки охоплюють лише зафіксовані позначки F1DB; відсутні дані не прирівнюються до нуля.' : 'Totals cover recorded F1DB flags only; missing data is not counted as zero.'}</p>
        {tables(metric.key, metric.data.drivers, metric.data.constructors)}
      </details>)}
    {sources.length > 0 && <details data-testid="circuit-classification-sources"><summary>{uk ? 'Походження позначок поулів і найшвидших кіл' : 'Pole and fastest-lap flag provenance'}</summary>
      <p>{uk ? 'Позначки з результатів гонок F1DB, а не припущення за стартовою решіткою чи кількістю очок. Нічиї збережено; конструктор враховується один раз за гонку.' : 'F1DB race-result flags, not assumptions from grid positions or points. Ties are retained; constructors count once per race.'}</p>
      <ul>{sources.map(source => <li key={`${source.source_locator}:${source.content_hash}`}><p>{source.release_tag} · {source.source_locator}</p><code>{source.content_hash}</code><p>{uk ? 'SHA-256 архіву' : 'Archive SHA-256'}: <code>{source.release_sha256}</code></p></li>)}</ul>
      <Link href="/sources">{uk ? 'Джерела та межі' : 'Sources and limits'} ↗</Link>
    </details>}
    <details data-testid="circuit-records-unavailable"><summary>{uk ? 'Рекорди кола та кваліфікаційні часи' : 'Lap records and qualifying times'}</summary>
      <p>{uk ? 'Позначка найшвидшого кола в окремій гонці не є рекордом траси. Рекорди гоночного кола, кваліфікаційні часи й рекорди окремих конфігурацій потребують різних записів із часом і джерелами. Часові показники ще не імпортовано.' : 'A fastest-lap flag in an individual race is not a circuit lap record. Race lap records, qualifying times and records for individual layouts require distinct sourced timing records. Timing values have not been imported yet.'}</p>
    </details>
  </section>;
}
