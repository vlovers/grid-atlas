import { Link } from '@/i18n/navigation';
import { ArchiveTable } from './archive-table';
import type { CircuitReadingModel } from './circuit-reader-model';

/** Distinct imported winning races, including shared drives; never standings. */
export function CircuitResultStatistics({ model, locale }: { model: CircuitReadingModel; locale: 'en' | 'uk' }) {
  const uk = locale === 'uk';
  return <section id="circuit-statistics" tabIndex={-1} aria-labelledby="circuit-statistics-title" data-testid="circuit-result-statistics">
    <h2 id="circuit-statistics-title">{uk ? 'Перемоги на цій трасі' : 'Winning at this circuit'}</h2>
    <p>{uk ? 'Кількість окремих гонок із перемогою в імпортованих результатах усіх конфігурацій. Спільна перемога зараховується кожному пілоту, а конструктору — один раз за гонку. Це не чемпіонські титули або офіційна статистика стартів.' : 'Distinct winning races in the imported results across all layouts. Shared victories count for each driver and once per constructor per race. These are not championship titles or official start totals.'}</p>
    <div className="circuit-statistics-grid">
      {(['drivers', 'constructors'] as const).map(kind => {
        const title = kind === 'drivers' ? (uk ? 'Пілоти' : 'Drivers') : (uk ? 'Конструктори' : 'Constructors');
        const rows = kind === 'drivers' ? model.driverWins : model.constructorWins;
        return <div key={kind}><h3>{title}</h3>{rows.length
          ? <ArchiveTable label={title} locale={locale}><table data-testid={`circuit-${kind}-wins`}><thead><tr><th scope="col">{title}</th><th scope="col">{uk ? 'Перемоги' : 'Wins'}</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}><th scope="row"><Link href={`/${kind}/${row.id}`}>{row.name}</Link></th><td>{row.wins}</td></tr>)}</tbody></table></ArchiveTable>
          : <p>{uk ? 'В архіві немає записів про переможців.' : 'No winner records are available in the archive.'}</p>}</div>;
      })}
    </div>
    <details data-testid="circuit-records-unavailable"><summary>{uk ? 'Поул-позиції та рекорди кола' : 'Pole positions and lap records'}</summary>
      <p>{uk ? 'Імпортовані таблиці результатів не містять цих показників. Рекорди гоночного кола, кваліфікаційні часи й рекорди окремих конфігурацій потребують різних записів із джерелами. Вони не виводяться з перемог або сучасних параметрів траси.' : 'The imported result tables do not contain these measurements. Race lap records, qualifying times and records for individual layouts require distinct sourced records. They are not inferred from victories or modern circuit specifications.'}</p>
    </details>
  </section>;
}
