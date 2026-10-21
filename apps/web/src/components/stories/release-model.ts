/** Curated questions and record coordinates, never approved historical prose. */
export type ReleasePilot = { slug: string; years: readonly number[]; races: readonly { year: number; round: number }[];
  peer: string; peerYear: number; prompt: { en: string; uk: string }; tone: 'mint' | 'gold' };
export const releasePilots: readonly ReleasePilot[] = [
  { slug: 'ayrton-senna', years: [1984, 1985, 1988, 1993], races: [{ year: 1984, round: 6 }, { year: 1985, round: 2 }, { year: 1988, round: 15 }, { year: 1993, round: 3 }], peer: 'alain-prost', peerYear: 1988, tone: 'mint', prompt: { en: 'Follow the thread. From one race to a whole career.', uk: 'Пройдіть шлях від однієї гонки до цілої кар’єри.' } },
  { slug: 'alain-prost', years: [1981, 1984, 1988, 1993], races: [{ year: 1981, round: 8 }, { year: 1984, round: 16 }, { year: 1986, round: 16 }, { year: 1993, round: 14 }], peer: 'ayrton-senna', peerYear: 1988, tone: 'gold', prompt: { en: 'Look closer. What changes from season to season?', uk: 'Погляньте ближче: що змінюється від сезону до сезону?' } },
  { slug: 'michael-schumacher', years: [1991, 1992, 2000, 2006], races: [{ year: 1991, round: 11 }, { year: 1992, round: 12 }, { year: 2000, round: 16 }, { year: 2006, round: 18 }], peer: 'fernando-alonso', peerYear: 2006, tone: 'gold', prompt: { en: 'Trace the chapters. Connect the teams, years and races.', uk: 'Поєднайте розділи: команди, роки та гонки.' } },
  { slug: 'lewis-hamilton', years: [2007, 2008, 2013, 2020], races: [{ year: 2007, round: 6 }, { year: 2008, round: 18 }, { year: 2013, round: 10 }, { year: 2020, round: 14 }], peer: 'max-verstappen', peerYear: 2021, tone: 'mint', prompt: { en: 'Explore the turning points. Then read the records.', uk: 'Дослідіть поворотні моменти. Перевірте протоколи.' } },
  { slug: 'max-verstappen', years: [2015, 2016, 2021, 2023, 2024], races: [{ year: 2016, round: 5 }, { year: 2021, round: 22 }, { year: 2023, round: 13 }, { year: 2024, round: 22 }], peer: 'lewis-hamilton', peerYear: 2021, tone: 'gold', prompt: { en: 'Change the year. Discover another perspective.', uk: 'Змініть рік. Відкрийте інший погляд.' } },
];
export const releasePilot = (slug: string) => releasePilots.find(p => p.slug === slug);
export function journeyYears(pilot: ReleasePilot, observed: readonly { year: number }[]) {
  const years = new Set(observed.map(r => r.year));
  return pilot.years.filter(year => years.has(year));
}
export function selectedYear(raw: unknown, years: readonly number[]): number | null {
  return typeof raw === 'string' && /^\d{4}$/.test(raw) && years.includes(Number(raw)) ? Number(raw) : years[0] ?? null;
}
