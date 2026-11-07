/** Exact first release batch. Adding another circuit requires its own acceptance. */
export const CIRCUIT_READER_BATCH = [
  'interlagos', 'montreal', 'hungaroring', 'zandvoort', 'melbourne',
  'bahrain', 'shanghai', 'sepang', 'imola', 'spielberg',
  'catalunya', 'paul-ricard', 'mexico-city', 'hockenheimring', 'nurburgring',
  'magny-cours', 'watkins-glen', 'buenos-aires', 'kyalami', 'indianapolis',
] as const;
export function isCircuitReaderBatch(id: string) {
  return (CIRCUIT_READER_BATCH as readonly string[]).includes(id);
}

export function circuitReaderDescription(name: string, locale: string) {
  return locale === 'uk'
    ? `${name}: Гран-прі з архіву, записи конфігурацій різних епох та історичний контекст із посиланнями на джерела.`
    : `${name}: archived Grands Prix, period-specific layout records and source-linked historical context.`;
}
