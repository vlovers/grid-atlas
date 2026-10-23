import { ArchiveTable } from './editorial/archive-table';
import { Link } from '@/i18n/navigation';

export type ChampionshipRow = {
  year?: number;
  entity_id?: string;
  entity_name?: string;
  position_display_order: number;
  position_number: number | null;
  position_text: string;
  championship_points: string;
  championship_won: boolean;
  engine_manufacturer_external_id: string | null;
  classification_status: 'source_reported_final' | 'provisional';
  source_locator: string;
  release_tag: string;
  release_sha256: string;
  content_hash: string;
};

export function ChampionshipTable({ rows, locale, kind, scope }: {
  rows: ChampionshipRow[];
  locale: 'uk' | 'en';
  kind: 'drivers' | 'constructors';
  scope: 'season' | 'career';
}) {
  const uk = locale === 'uk';
  const heading = kind === 'drivers'
    ? (uk ? 'Залік пілотів за F1DB' : 'F1DB drivers’ classification')
    : (uk ? 'Залік конструкторів за F1DB' : 'F1DB constructors’ classification');
  return <section className="chapter" data-testid={`championship-${kind}-${scope}`}>
    <h2>{heading}</h2>
    <p>{uk
      ? 'Окрема класифікація з випуску F1DB, не сума очок за протоколами перегонів і не незалежна перевірка FIA. Позиції поточного сезону попередні.'
      : 'Separate source-reported F1DB standings, not a sum of race-result points or independent FIA verification. Current-season positions are provisional.'}</p>
    {rows.length ? <ArchiveTable label={heading} locale={locale}><table>
      <thead><tr>
        {scope === 'career' && <th scope="col">{uk ? 'Сезон' : 'Season'}</th>}
        <th scope="col">{uk ? 'Місце' : 'Position'}</th>
        {scope === 'season' && <th scope="col">{uk ? 'Учасник' : 'Competitor'}</th>}
        <th scope="col">{uk ? 'Очки заліку' : 'Championship points'}</th>
        {kind === 'constructors' && <th scope="col">{uk ? 'Двигун' : 'Engine'}</th>}
        <th scope="col">{uk ? 'Статус' : 'Status'}</th>
      </tr></thead>
      <tbody>{rows.map((item) => {
        const provisional = item.classification_status === 'provisional';
        return <tr key={`${item.year ?? ''}:${item.position_display_order}:${item.entity_id ?? ''}`}>
          {scope === 'career' && <th scope="row"><Link href={`/seasons/${item.year}`}>{item.year}</Link></th>}
          <td>{item.position_text}</td>
          {scope === 'season' && <td>{item.entity_id
            ? <Link href={`/${kind}/${item.entity_id}`}>{item.entity_name}</Link>
            : (item.entity_name ?? '—')}</td>}
          <td>{item.championship_points}</td>
          {kind === 'constructors' && <td>{item.engine_manufacturer_external_id ?? '—'}</td>}
          <td>{provisional ? (uk ? 'Попередній' : 'Provisional')
            : item.championship_won ? (uk ? 'Чемпіон за F1DB' : 'F1DB champion')
              : '—'}</td>
        </tr>;
      })}</tbody>
    </table></ArchiveTable> : <p>{uk ? 'Даних класифікації немає.' : 'No classification records.'}</p>}
    {rows.length > 0 && <details>
      <summary>{uk ? 'Джерело класифікації' : 'Classification provenance'}</summary>
      <p>F1DB · {rows[0].release_tag} · <Link href="/sources">{uk ? 'Джерела' : 'Sources'}</Link></p>
      <p>{uk ? 'Точне джерело кожного рядка доступне через API разом із SHA-256.' : 'Exact source locator and SHA-256 are available with every API row.'}</p>
    </details>}
  </section>;
}
