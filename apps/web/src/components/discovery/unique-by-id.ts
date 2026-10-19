/** Preserve supplied order and the first record for each caller-owned identity. */
export function uniqueById<T extends { readonly id: string }>(records: readonly T[]): T[] {
  const seen = new Set<string>();
  return records.filter(record => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}
