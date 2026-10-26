/** Exact official F1 result indexes for ten bilingual editorial narratives. Links support checking race results; they do not attest to every claim in the manuscript. */
export const editorialOfficialResults: Record<string, readonly { year: number; url: string }[]> = {
  'lauda-hunt-1976': [{ year: 1976, url: 'https://www.formula1.com/en/results/1976/races' }],
  'senna-prost-1988-89': [{ year: 1988, url: 'https://www.formula1.com/en/results/1988/races' }, { year: 1989, url: 'https://www.formula1.com/en/results/1989/races' }],
  'villeneuve-arnoux-1979': [{ year: 1979, url: 'https://www.formula1.com/en/results/1979/races' }],
  'vettel-monza-2008': [{ year: 2008, url: 'https://www.formula1.com/en/results/2008/races' }],
  'button-canada-2011': [{ year: 2011, url: 'https://www.formula1.com/en/results/2011/races' }],
  'perez-sakhir-2020': [{ year: 2020, url: 'https://www.formula1.com/en/results/2020/races' }],
  'kubica-bmw-2008': [{ year: 2008, url: 'https://www.formula1.com/en/results/2008/races' }],
  'schumacher-ferrari-1996-2000': [1996, 1997, 1998, 1999, 2000].map(year => ({ year, url: `https://www.formula1.com/en/results/${year}/races` })),
  'massa-2008': [{ year: 2008, url: 'https://www.formula1.com/en/results/2008/races' }],
  'brawn-2009': [{ year: 2009, url: 'https://www.formula1.com/en/results/2009/races' }],
};
