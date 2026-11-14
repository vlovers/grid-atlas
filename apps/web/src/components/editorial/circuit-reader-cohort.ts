import targets from './circuit-targets.json' with { type: 'json' };

/** Engineering scope only: membership never grants editorial or media approval. */
export const CIRCUIT_READER_BATCH = targets.targets.map(row => row.circuit_id);
export function isCircuitReaderBatch(id: string) {
  return (CIRCUIT_READER_BATCH as readonly string[]).includes(id);
}

export function circuitReaderDescription(name: string, locale: string) {
  return locale === 'uk'
    ? `${name}: Гран-прі з архіву, записи конфігурацій різних епох та історичний контекст із посиланнями на джерела.`
    : `${name}: archived Grands Prix, period-specific layout records and source-linked historical context.`;
}
