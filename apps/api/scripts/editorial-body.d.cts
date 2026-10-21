export function articleSections<T extends { statement: string }>(body: string, claims: readonly T[]): { heading: string; claims: T[] }[];
