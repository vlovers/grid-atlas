import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getData } from './api';
import { validId } from './catalogue';
import { routeMetadata, type Crumb } from './seo';

export type EntityKind = 'drivers' | 'constructors' | 'seasons' | 'races' | 'circuits' | 'entrants';
type Record = { name: string; year: number; official_name: string; season_year: number };
const sections = {
  drivers: ['driversTitle', 'driverLead'], constructors: ['constructorsTitle', 'constructorLead'],
  seasons: ['seasonsTitle', 'seasonLead'], races: ['seasonsTitle', 'raceResultsLead'],
  circuits: ['circuitsTitle', 'circuitsLead'], entrants: ['lineageTitle', 'entrantLead'],
} as const;

// Only public historical identities, never editorial drafts or article slugs.
export const entitySeo = cache(async (kind: EntityKind, id: string, locale: string) => {
  if (kind === 'seasons'
    ? !/^[0-9]{4}$/.test(id) || Number(id) < 1950 || Number(id) > 2200
    : !validId(id)) notFound();
  const [record] = await getData<Record>(`/api/${kind}/${id}`);
  if (!record) notFound();
  const t = await getTranslations({ locale, namespace: 'UI' });
  const title = kind === 'seasons' ? t('seasonTitle', { year: id })
    : kind === 'races' ? `${record.season_year} · ${record.official_name}` : kind === 'constructors' ? `${record.name} — ${t('constructor')}`
    : kind === 'entrants' ? `${record.name} — ${t('entrant')}` : record.name;
  const description = `${title} — ${t(sections[kind][1])}`;
  const sectionPath = kind === 'entrants' ? '/lineage' : kind === 'races' ? '/seasons' : `/${kind}`;
  const crumbs: Crumb[] = [{ name: t('home'), path: '/' }, { name: t(sections[kind][0]), path: sectionPath }];
  if (kind === 'races') crumbs.push({ name: t('seasonTitle', { year: record.season_year }), path: `/seasons/${record.season_year}` });
  crumbs.push({ name: title, path: `/${kind}/${id}` });
  return { title, description, crumbs, metadata: { ...routeMetadata(locale, `/${kind}/${id}`), description } };
});
