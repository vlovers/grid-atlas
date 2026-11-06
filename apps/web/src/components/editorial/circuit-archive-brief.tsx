import { Link } from '@/i18n/navigation';

/** First Content Factory cohort, selected by the pinned F1DB v2026.17.0 race-record audit.
 * All figures below are derived from the live archive API, not from unapproved editorial text.
 */
export const FIRST_CIRCUIT_BATCH = new Set([
  'monza', 'monaco', 'silverstone', 'spa-francorchamps', 'montreal',
  'interlagos', 'hungaroring', 'nurburgring', 'spielberg', 'hockenheimring',
  'catalunya', 'suzuka', 'zandvoort', 'imola', 'melbourne',
  'mexico-city', 'bahrain', 'buenos-aires', 'kyalami', 'sepang',
  'watkins-glen', 'indianapolis', 'shanghai', 'magny-cours', 'paul-ricard',
]);

type Props = {
  externalId: string;
  locale: 'en' | 'uk';
  raceRecords: number;
  firstSeason: number | null;
  lastSeason: number | null;
  layoutCount: number;
};

export function CircuitArchiveBrief({ externalId, locale, raceRecords, firstSeason, lastSeason, layoutCount }: Props) {
  if (!FIRST_CIRCUIT_BATCH.has(externalId)) return null;
  const uk = locale === 'uk';
  const yearRange = firstSeason === null ? '—' : firstSeason === lastSeason
    ? String(firstSeason) : `${firstSeason}–${lastSeason ?? '—'}`;
  return <section aria-labelledby="circuit-archive-brief-title" data-testid="circuit-content-factory-brief">
    <p className="eyebrow">{uk ? 'Коротко про трасу' : 'The circuit at a glance'}</p>
    <h2 id="circuit-archive-brief-title">{uk ? 'З архіву Формули-1' : 'From the Formula 1 archive'}</h2>
    <p>{uk
      ? `Архів пов’язує цю трасу з ${raceRecords} записами про етапи Формули-1. Серед них можуть бути й заплановані гонки.`
      : `The archive associates this circuit with ${raceRecords} Formula 1 race records, which may include scheduled events.`}</p>
    <dl className="circuit-factory-facts">
      <div><dt>{uk ? 'Сезони в архіві' : 'Archived seasons'}</dt><dd>{yearRange}</dd></div>
      <div><dt>{uk ? 'Історичні конфігурації' : 'Historical layouts'}</dt><dd>{layoutCount}</dd></div>
    </dl>
    <p>{uk
      ? 'Історичні конфігурації можуть відрізнятися від сучасної. Ці відомості походять з архіву F1DB; розгорнуті історії публікуються після окремої редакторської перевірки.'
      : 'Historical configurations may differ from today’s circuit. These facts come from the F1DB archive; extended histories require separate editorial review before publication.'}
      {' '}<Link href="/sources">{uk ? 'Джерела' : 'Sources'}</Link>
    </p>
  </section>;
}
