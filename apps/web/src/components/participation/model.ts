import { teamEras, type Participation } from '../driver/showcase-model.ts';

export type RelatedIdentity = { id: string; name: string };
export type ParticipationChange = {
  state: 'available' | 'first' | 'gap' | 'incomplete';
  previousYear: number | null;
  added: RelatedIdentity[]; retained: RelatedIdentity[]; absent: RelatedIdentity[];
};

/** Calendar windows never bridge unobserved years or coerce canonical BIGINT IDs. */
export function participationHistory(rows: readonly Participation[], seasons: readonly number[], requested?: number, width = 7) {
  const years = [...new Set([...seasons, ...rows.map(row => row.year)])].filter(Number.isSafeInteger).sort((a,b) => a-b);
  const selected = requested !== undefined && years.includes(requested) ? requested : years.at(-1);
  const span = Math.max(1, Math.min(9, Math.trunc(width) || 7));
  const start = selected === undefined ? 0 : Math.max(years[0], Math.min(selected-Math.floor(span/2), years.at(-1)!-span+1));
  const calendar = selected === undefined ? [] : Array.from({length: Math.min(span, years.at(-1)!-start+1)},(_,i) => start+i);
  const observed = new Set(years);
  const groups = new Map<string, Participation[]>();
  for (const row of rows) groups.set(row.related_id, [...(groups.get(row.related_id) ?? []), row]);
  const series = [...groups].map(([id, records]) => ({
    id, name: records[0].related_name,
    periods: teamEras(records),
    cells: calendar.map(year => ({year, recorded: observed.has(year), rows: records.filter(row => row.year === year)})),
  })).filter(item => item.cells.some(cell => cell.rows.length))
    .sort((a,b) => Math.min(...a.periods.map(period => period.years[0]))-Math.min(...b.periods.map(period => period.years[0])) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const identitySet = (year: number) => new Map(rows.filter(row => row.year === year).map(row => [row.related_id,{id:row.related_id,name:row.related_name}]));
  const current = selected === undefined ? new Map<string,RelatedIdentity>() : identitySet(selected);
  const previousYear = selected === undefined || selected === years[0] ? null : selected-1;
  const prior = previousYear === null ? new Map<string,RelatedIdentity>() : identitySet(previousYear);
  const state: ParticipationChange['state'] = !current.size ? 'incomplete' : previousYear === null ? 'first'
    : !observed.has(previousYear) ? 'gap' : !prior.size ? 'incomplete' : 'available';
  const changes: ParticipationChange = {state,previousYear,added:[],retained:[],absent:[]};
  if(state === 'available') {
    changes.added = [...current.values()].filter(row => !prior.has(row.id));
    changes.retained = [...current.values()].filter(row => prior.has(row.id));
    changes.absent = [...prior.values()].filter(row => !current.has(row.id));
  }
  const at = selected === undefined ? -1 : years.indexOf(selected);
  return {years, selected, calendar, series, changes, previous:at>0?years[at-1]:null, next:at>=0&&at<years.length-1?years[at+1]:null,
    eras:teamEras(rows), selectedRows:rows.filter(row => row.year===selected)};
}

export function evidencePath(locale: 'uk'|'en', kind: 'driver'|'constructor', focusId: string, relatedId: string, year: number) {
  const [driver,constructor] = kind === 'driver' ? [focusId,relatedId] : [relatedId,focusId];
  return `/${locale}/explorer/evidence/${driver}/${constructor}?${new URLSearchParams({year:String(year),from:kind,selected:relatedId})}`;
}
