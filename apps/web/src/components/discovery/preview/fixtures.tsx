/* eslint-disable @next/next/no-html-link-for-pages -- Standalone static preview, outside the Next router. */
import { CareerTimeline, DiscoveryCards, QuickFacts, RelatedJourneys } from '../index';
import type { CareerEntry, DiscoveryItem, QuickFact, RelatedJourney } from '../types';

/** Synthetic records only. These identifiers and values must never enter the archive. */
const facts: readonly QuickFact[] = [
  { id: 'seasons', label: 'Recorded seasons', value: '2' },
  { id: 'wins', label: 'Wins', value: '0', detail: {
    label: 'How this is counted',
    text: 'Synthetic count for interaction testing. Zero is known; an unavailable value is shown separately.',
    source: { href: '/preview/coverage', label: 'Fixture coverage note' },
  } },
  { id: 'points', label: 'Points', value: '12.5' },
  { id: 'unknown', label: 'Unavailable statistic', value: null },
];

const cards: readonly DiscoveryItem[] = [
  { id: 'season', kind: 'Season', title: '2001', relationship: 'A supplied season for Fixture Driver A',
    summary: 'Open a season record to explore its supplied race results and related entries.',
    destination: { href: '/preview/season-2001', label: 'Explore fixture season' }, fact: { label: 'Recorded entries', value: '3' } },
  { id: 'team', kind: 'Constructor', title: 'Fixture Constructor A', relationship: 'One of two constructors in the same supplied season',
    summary: 'A constructor remains a named record. This card makes no claim about entrant identity or historical lineage.',
    destination: { href: '/preview/constructor-a', label: 'Explore fixture constructor' } },
];

const career: readonly CareerEntry[] = [
  { id: '2001', period: '2001', title: 'Two supplied constructor records', summary: '3 recorded entries · 0 wins',
    destination: { href: '/preview/season-2001', label: 'Explore fixture season' },
    entities: [{ id: 'constructor:a', href: '/preview/constructor-a', label: 'Fixture Constructor A' }, { id: 'constructor:b', href: '/preview/constructor-b', label: 'Fixture Constructor B' }],
    detail: { label: 'Read entry context', text: 'This synthetic entry exercises a season with multiple constructors. No merger, rename or continuous identity is implied.' } },
  { id: '2003', period: '2003', title: 'Another supplied season', summary: 'Only supplied entries appear. No record is inferred for the intervening year.',
    entities: [{ id: 'constructor:b', href: '/preview/constructor-b', label: 'Fixture Constructor B' }] },
];

const journeys: readonly RelatedJourney[] = [
  { id: 'driver', kind: 'Driver', destination: { href: '/preview/driver-a', label: 'Fixture Driver A' },
    relationship: 'Appears in the supplied season record', context: 'Follow the record to explore its supplied career entries.' },
  { id: 'constructor', kind: 'Constructor', destination: { href: '/preview/constructor-a', label: 'Fixture Constructor A' },
    relationship: 'Listed alongside this driver in supplied results' },
  { id: 'season', kind: 'Season', destination: { href: '/preview/season-2001', label: '2001 fixture season' },
    relationship: 'Connects the supplied driver and constructor records', context: 'Relationships come from fixture data, not name matching.' },
];

// Duplicate source observations exercise ID-based deduplication, without merging names or URLs.
const repeatedCareer: readonly CareerEntry[] = career.map(entry => ({ ...entry, entities: [
  { id: 'constructor:a', href: '/preview/constructor-a', label: 'Shared fixture name' },
  { id: 'constructor:a', href: '/preview/constructor-a?duplicate=1', label: 'Duplicate constructor row' },
  { id: 'constructor:b', href: '/preview/constructor-b', label: 'Shared fixture name' },
] }));
const repeatedJourneys: readonly RelatedJourney[] = [
  { ...journeys[0], id: 'driver:a:result-season:2001', relationship: 'Recorded in the 2001 fixture season' },
  { ...journeys[0], id: 'driver:a:result-season:2001', relationship: 'Duplicate observation row',
    destination: { href: '/preview/driver-a?duplicate=1', label: 'Duplicate driver row' } },
  { ...journeys[0], id: 'driver:a:result-season:2003', relationship: 'Recorded in the 2003 fixture season' },
];

export function ComponentPreview({ variant = 'default' }: { variant?: string }) {
  const empty = variant === 'empty';
  const stress = variant === 'stress';
  const french = variant === 'fr';
  const identity = variant === 'identity';
  const longLabel = 'LongUnbrokenFixtureRecord'.repeat(7);
  const previewFacts = identity ? [
    { id: 'result-entries', label: 'Result entries', value: '3' },
    { id: 'distinct-races', label: 'Distinct races with recorded results', value: '2' },
  ] : french ? [
    { id: 'points', label: 'Points', value: new Intl.NumberFormat('fr-FR').format(1234.5) },
    { id: 'wins', label: 'Victoires', value: '0', detail: { label: 'Comprendre ce chiffre', text: 'Données fictives pour tester le composant.' } },
    { id: 'unknown', label: 'Valeur indisponible', value: null },
  ] : stress ? [{ id: 'long', label: longLabel, value: '1,234,567,890.5' }, ...facts] : facts;

  return <>
    <header className="preview-header"><span>GRID ATLAS / COMPONENT LAB</span><nav aria-label="Preview variants">
      <a href="/">Default</a><a href="/?variant=empty">Empty</a><a href="/?variant=stress">Long content</a><a href="/?variant=fr">French props</a><a href="/?variant=identity">Identity and duplicates</a>
    </nav></header>
    <main className="preview-main">
      <p className="preview-kicker">SYNTHETIC COMPONENT FIXTURES · NO HISTORICAL CLAIMS</p>
      <h1>Follow your curiosity.</h1>
      <p className="preview-intro">A small archive toolkit. Facts first, connected records next, context when you want it.</p>
      <section className="preview-section"><h2>{french ? 'En quelques chiffres' : 'At a glance'}</h2>
        <QuickFacts label={french ? 'Chiffres clés' : 'Career quick facts'} facts={empty ? [] : previewFacts}
          unavailableLabel={french ? 'Indisponible' : 'Unavailable'} emptyLabel="No supplied facts."
          note={french ? 'Exemple fictif · valeurs formatées par le parent.' : 'Fixture coverage only. Values are not historical statistics.'} />
      </section>
      <section className="preview-section"><h2>Discover the context</h2>
        <DiscoveryCards label="Contextual discovery" emptyLabel="No supplied discovery records."
          items={empty ? [] : stress ? cards.map(item => ({ ...item, title: longLabel, summary: '<script>window.fixtureInjected = true</script>' })) : cards} />
      </section>
      <section className="preview-section"><h2>A career, one entry at a time</h2>
        <CareerTimeline label="Recorded career" emptyLabel="No supplied career entries."
          note="Caller-supplied order and coverage. The gap between entries makes no claim about activity."
          entries={empty ? [] : identity ? repeatedCareer : stress ? career.map(entry => ({ ...entry, period: longLabel, title: longLabel, entities: [{ id: 'constructor:a', href: '/preview/constructor-a', label: longLabel }] })) : career} />
      </section>
      <section className="preview-section"><h2>Where next?</h2>
        <RelatedJourneys label="Related archive journeys" emptyLabel="No supplied related records."
          items={empty ? [] : identity ? repeatedJourneys : stress ? journeys.map(item => ({ ...item, kind: longLabel, destination: { ...item.destination, label: longLabel } })) : journeys} />
      </section>
    </main>
    <footer className="preview-footer">Isolated component preview · no API, database, licensed artwork or production routes.</footer>
  </>;
}
