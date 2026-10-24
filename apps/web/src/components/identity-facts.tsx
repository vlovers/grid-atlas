import { Link } from '@/i18n/navigation';
import styles from './identity-facts.module.css';

export type IdentityDetails = {
  external_id: string; source_slug: string; source_url: string; attribution: string;
  fields: Record<string, string | number>;
  provenance: { release_tag: string; artifact_name: string; sha256: string;
    source_locator: string; content_hash: string; imported_at: string; method: 'source_reported' } | null;
};

const labels = {
  full_name: ['Повне ім’я / назва', 'Full name'], abbreviation: ['Код в архіві', 'Archive code'],
  permanent_number: ['Постійний номер в архіві', 'Archive permanent number'],
  date_of_birth: ['Дата народження', 'Date of birth'], date_of_death: ['Дата смерті', 'Date of death'],
  place_of_birth: ['Місце народження', 'Place of birth'], nationality: ['Національність за джерелом', 'Source-reported nationality'],
  second_nationality: ['Друга національність за джерелом', 'Second source-reported nationality'],
  country: ['Країна за джерелом', 'Source-reported country'], place_name: ['Розташування', 'Location'],
  circuit_type: ['Тип траси за джерелом', 'Source-reported circuit type'],
} as const;
const circuitTypes: Record<string, [string, string]> = {
  STREET: ['Вулична', 'Street'], ROAD: ['Стаціонарна', 'Road'],
  RACE: ['Стаціонарна', 'Race'], HYBRID: ['Комбінована', 'Hybrid'],
};

/** Only allowlisted source fields; no empty rows or inferred historical validity. */
export function IdentityFacts({ identity, locale }: { identity: IdentityDetails; locale: 'uk' | 'en' }) {
  const index = locale === 'uk' ? 0 : 1;
  return <section className={styles.identity} aria-labelledby="identity-heading" data-testid="identity-facts">
    <details><summary><h2 id="identity-heading">{locale === 'uk' ? 'Паспорт архіву' : 'Archive identity'}</h2></summary>
    <dl className={styles.facts}>
      <div><dt>{locale === 'uk' ? 'Ідентифікатор джерела' : 'Source identifier'}</dt><dd>{identity.source_slug} · {identity.external_id}</dd></div>
      {Object.entries(labels).map(([key, label]) => {
        const value = identity.fields[key];
        if (value === undefined || value === null || value === '') return null;
        return <div key={key}><dt>{label[index]}</dt><dd>{key === 'circuit_type'
          ? circuitTypes[String(value)]?.[index] ?? value : value}</dd></div>;
      })}
    </dl>
    <p>{locale === 'uk'
      ? 'Поля передано з ідентифікаційного запису джерела; назви та дати збережено. Код, номер, національність, країна й тип траси не підтверджують їхню чинність у кожному історичному сезоні.'
      : 'Fields come from the source identity record; names and dates are preserved. Code, number, nationality, country and circuit type do not establish their validity in every historical season.'}</p>
    {identity.provenance ? <details><summary>{locale === 'uk' ? 'Походження полів' : 'Field provenance'} · {identity.provenance.release_tag}</summary>
      <p>{identity.attribution}</p><p>{identity.provenance.source_locator}</p>
      <p>{identity.provenance.artifact_name}</p><code>{identity.provenance.sha256}</code>
      <p>{locale === 'uk' ? 'SHA-256 запису' : 'Record SHA-256'}</p><code>{identity.provenance.content_hash}</code>
      <p><a href={identity.source_url} target="_blank" rel="noopener noreferrer">{identity.source_slug} ↗</a></p>
    </details> : <p>{locale === 'uk' ? 'Додаткові поля ідентичності ще не імпортовано.' : 'Additional identity fields have not been imported.'}</p>}
    <Link href="/sources">{locale === 'uk' ? 'Джерела та межі статистики' : 'Sources and statistical limitations'} ↗</Link>
    </details>
  </section>;
}
