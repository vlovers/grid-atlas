import { getLocale } from 'next-intl/server';
import { getData, type Driver, type Season, type CatalogueEntity } from '@/lib/api';
import { routeMetadata } from '@/lib/seo';
import { atlasCopy } from '@/components/atlas/copy';
import { featuredIdentities } from '@/components/atlas/discovery-model';
import { ConnectionPreview } from '@/components/atlas/connection-preview';
import { ComparisonLauncher } from '@/components/atlas/comparison-launcher';
import { SeasonBrowser } from '@/components/atlas/season-browser';
import { StoryRail } from '@/components/stories/story-rail';
import { storyCopy } from '@/components/stories/copy';
import { openingRecord, sharedSeason } from '@/components/stories/story-model';
import type { DriverCareer, DriverSeason } from '@/components/driver/showcase-model';
import { selectCircuitCoverArtwork } from '@/components/circuit-layout-registry';
import { EditorialHero, SectionHeading, SourceAttribution } from '@/components/editorial/primitives';
import { editorialCopy } from '@/components/editorial/copy';
import { RaceCover } from '@/components/editorial/race-cover';
import { CIRCUIT_ARTWORK } from '@/components/circuit-layout-registry';
import type { CircuitTechnicalEvent } from '@/components/circuit-experience';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';
export const generateMetadata = async () => routeMetadata(await getLocale(), '/');

export default async function Home() {
  const locale = await getLocale() as 'uk' | 'en';
  const t = atlasCopy[locale]; const s = storyCopy[locale]; const e = editorialCopy[locale];
  const names = ['ayrton-senna', 'juan-manuel-fangio', 'lewis-hamilton'];
  const circuitNames = ['monaco', 'spa-francorchamps', 'suzuka'];
  // All discovery is bounded and canonical identities are resolved per import.
  const [seasons, fallback, matches, circuitMatches, circuitFallback, pairedMatches] = await Promise.all([
    getData<Season>('/api/seasons'), getData<Driver>('/api/drivers?limit=3'),
    Promise.all(names.map(name => getData<Driver>(`/api/drivers?q=${name}&limit=10`))),
    Promise.all(circuitNames.map(name => getData<CatalogueEntity>(`/api/circuits?q=${name}&limit=5`))),
    getData<CatalogueEntity>('/api/circuits?limit=3'), getData<Driver>('/api/drivers?q=alain-prost&limit=5'),
  ]);
  const identities = featuredIdentities(matches.map((rows, i) => rows.find(d => d.external_id === names[i])), fallback);
  const load = async (driver: Driver) => {
    const [careers, years] = await Promise.all([getData<DriverCareer>(`/api/drivers/${driver.id}/career?locale=${locale}`), getData<DriverSeason>(`/api/drivers/${driver.id}/seasons`)]);
    return { driver, career: careers[0], years };
  };
  const pairedIdentity = pairedMatches.find(d => d.external_id === 'alain-prost');
  const [featured, paired] = await Promise.all([Promise.all(identities.map(load)), pairedIdentity ? load(pairedIdentity) : null]);
  const circuits = featuredIdentities(circuitMatches.map((rows, i) => rows.find(c => c.external_id === circuitNames[i])), circuitFallback);
  // Only display an SVG if the archived circuit API confirms its exact layout identity.
  const circuitArtworks = await Promise.all(circuits.map(async circuit => {
    const layouts = await getData<{ external_layout_id: string; effective: boolean }>(`/api/circuits/${circuit.id}/layouts`);
    return selectCircuitCoverArtwork(layouts);
  }));
  const constructorNames = ['mclaren', 'ferrari', 'williams'];
  const [constructorMatches, constructorFallback] = await Promise.all([
    Promise.all(constructorNames.map(name => getData<CatalogueEntity>(`/api/constructors?q=${name}&limit=5`))),
    getData<CatalogueEntity>('/api/constructors?limit=3'),
  ]);
  const constructorIdentities = featuredIdentities(constructorMatches.map((rows, i) => rows.find(c => c.external_id === constructorNames[i])), constructorFallback);
  const constructors = await Promise.all(constructorIdentities.map(async constructor => ({ constructor,
    career: (await getData<DriverCareer>(`/api/constructors/${constructor.id}/career?locale=${locale}`))[0] ?? null,
  })));
  const focus = featured[0];
  const years = [...new Set(focus?.years.map(row => row.year) ?? [])].sort((a, b) => a - b);
  const associations = [...new Map((focus?.career?.participation ?? []).map(row => [row.related_id, row])).values()];
  const moments = featured.flatMap(item => { const moment = openingRecord(item.career); return moment ? [{ ...item, moment }] : []; });
  const cover = moments[0];
  const pairYear = focus && paired ? sharedSeason(focus.years, paired.years) : null;
  const path = (value: string) => `/${locale}${value}`;
  const num = (n: number) => new Intl.NumberFormat(locale).format(n);
  const coverEvents = cover?.moment.race.circuit_id ? await getData<CircuitTechnicalEvent>(`/api/circuits/${cover.moment.race.circuit_id}/technical-history`) : [];
  const coverLayout = coverEvents.find(event => event.race_id === cover?.moment.race.id)?.external_layout_id;
  const coverArtwork = coverLayout ? CIRCUIT_ARTWORK.get(coverLayout) : undefined;
  const range = (first: number | null | undefined, last: number | null | undefined) => first == null ? '—' : first === last ? String(first) : `${first}—${last}`;
  return <div className={styles.home} data-testid="atlas-home">
    <section className={styles.masthead} aria-label={e.edition}>
      <div className={styles.editionLine}><p>{e.edition}</p><span>{e.volume}</span></div>
      <EditorialHero title={e.homeTitle} eyebrow={e.cover} context={focus?.driver.name}
        lead={e.homeLead} media={cover ? <RaceCover moment={cover.moment} driverName={cover.driver.name} locale={locale} artwork={coverArtwork} firstWin={Boolean(cover.career?.milestones.first_win)} /> : <div className={styles.coverEmpty} data-testid="home-season-cover"><p className={styles.eyebrow}>{e.seasons}</p><h2>{s.erasTitle}</h2><nav aria-label={locale === 'uk' ? 'Сезони на обкладинці' : 'Cover seasons'}>{seasons.slice(0, 6).map(season => <a key={season.year} href={path(`/seasons/${season.year}`)}>{season.year} ↗</a>)}</nav></div>}
        actions={<><a href={cover ? path(`/races/${cover.moment.race.id}`) : '#atlas-seasons'}><span className={styles.roundArrow} aria-hidden="true">↗</span>{cover ? s.start : t.start}</a>
          {focus && <a href={path(`/drivers/${focus.driver.id}`)}>{e.openDossier} ↗</a>}</>} />
      <div className={styles.coverFooter}>
        <form className={styles.search} action={path('/drivers')} role="search"><label htmlFor="home-search">{t.search}</label><div><input id="home-search" name="q" type="search" maxLength={100} placeholder={t.placeholder} /><button type="submit" aria-label={t.searchAction}>↗</button></div></form>
        <nav className={styles.contents} aria-label={e.contents}><a href="#home-drivers-title">01 / {e.drivers}</a><a href="#home-constructors-title">02 / {e.constructors}</a><a href="#atlas-seasons">03 / {e.seasons}</a></nav>
      </div>
    </section>
    <div className={styles.editionStrip}><span>{t.live}</span><strong>{num(seasons.length)} {t.seasons}</strong><span>{seasons.length ? `${Math.min(...seasons.map(row => row.year))}—${Math.max(...seasons.map(row => row.year))}` : '—'}</span><a href={path('/sources')}>{e.source} ↗</a></div>

    <section className={styles.people} aria-labelledby="home-drivers-title" data-story-reveal>
      <SectionHeading kicker={e.people} title={e.peopleTitle} note={e.peopleNote} id="home-drivers-title" />
      <div className={styles.peopleLayout}>{featured.map(({ driver, career }, index) => <a key={driver.id} className={index === 0 ? styles.personLead : styles.personRow} href={path(`/drivers/${driver.id}`)}>
        <span className={styles.ordinal}>0{index + 1} / {e.dossier}</span><h3>{driver.name}</h3>
        <span className={styles.personYears}>{range(career?.summary.first_season, career?.summary.last_season)}</span>
        <span className={styles.readLink}>{e.openDossier} ↗</span>
      </a>)}</div>
      {!featured.length && <p className={styles.note}>{t.noDrivers}</p>}<a className={styles.textLink} href={path('/drivers')}>{e.allDrivers} ↗</a>
    </section>

    <section className={styles.section} aria-labelledby="home-constructors-title" data-story-reveal data-testid="featured-constructors">
      <SectionHeading kicker={e.machines} title={e.machinesTitle} note={e.machinesNote} id="home-constructors-title" />
      <div className={styles.constructorList}>{constructors.map(({ constructor, career }, index) => <a key={constructor.id} href={path(`/constructors/${constructor.id}`)}>
        <span className={styles.ordinal}>0{index + 1}</span><h3>{constructor.name}</h3>
        <span className={styles.constructorYears}>{range(career?.summary.first_season, career?.summary.last_season)}<small>{e.years}</small></span>
        <span className={styles.constructorWins}>{career ? num(career.summary.winning_races) : '—'}<small>{t.winningRaces}</small></span><span aria-hidden="true">↗</span>
      </a>)}</div><a className={styles.textLink} href={path('/constructors')}>{e.allConstructors} ↗</a>
    </section>

    <section id="atlas-seasons" className={`${styles.section} ${styles.era}`} aria-labelledby="home-seasons-title" data-story-reveal>
      <SectionHeading kicker={s.eras} title={s.erasTitle} note={s.erasNote} id="home-seasons-title" /><SeasonBrowser seasons={seasons} locale={locale} /><a className={styles.textLink} href={path('/seasons')}>{t.allSeasons} ↗</a>
    </section>

    <section id="front-page" className={styles.section} aria-labelledby="home-moments-title" data-story-reveal>
      <SectionHeading kicker={s.featured} title={s.moments} note={s.momentNote} id="home-moments-title" />
      {moments.length ? <StoryRail label={s.moments} locale={locale}>{moments.map(({ driver, career, moment }) => <a className={styles.moment} key={driver.id} href={path(`/races/${moment.race.id}`)}>
        <span className={styles.ordinal}>{driver.name} / {career?.milestones.first_win ? s.firstWin : s.firstRace}</span><span className={styles.momentYear}>{moment.race.year}</span><h3>{moment.race.name}</h3><span className={styles.readLink}>{s.openRace} ↗</span>
      </a>)}</StoryRail> : <p className={styles.note}>{s.noMoments}</p>}
    </section>

    <section className={styles.narrative} aria-labelledby="home-narrative-title" data-testid="season-perspectives" data-story-reveal>
      <div className={styles.narrativeNumber} aria-hidden="true">{pairYear ?? '↔'}</div>
      <div className={styles.narrativeCopy}><p className={styles.eyebrow}>{s.narrative}</p><h2 id="home-narrative-title">{pairYear ? s.narrativeTitle : s.narrativeEmpty}</h2><p className={styles.note}>{pairYear ? s.narrativeNote : s.narrativeEmptyNote}</p>
        {pairYear && focus && paired ? <div className={styles.pairLinks}>{[focus, paired].map(item => <a key={item.driver.id} href={path(`/explorer/drivers/${item.driver.id}?year=${pairYear}`)}><span>{pairYear} / {s.perspective}</span><strong>{item.driver.name} ↗</strong></a>)}</div> : <a className={styles.textLink} href={path('/drivers')}>{t.allDrivers} ↗</a>}
      </div>
    </section>

    <section className={styles.section} aria-labelledby="home-circuits-title" data-story-reveal>
      <SectionHeading kicker={s.circuits} title={s.circuitsTitle} note={s.circuitsNote} id="home-circuits-title" />
      <StoryRail label={s.circuitsTitle} locale={locale}>{circuits.map((circuit, index) => <article className={styles.circuit} key={circuit.id}>
        <span className={styles.ordinal}>0{index + 1} / {s.circuits}</span><h3><a href={path(`/circuits/${circuit.id}`)}>{circuit.name}</a></h3><span className={styles.circuitId}>{circuit.external_id}</span>
        {circuitArtworks[index] && <figure className={styles.circuitPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={circuitArtworks[index].path} width={500} height={500} loading="lazy" alt={locale === 'uk'
            ? `Контур конфігурації ${circuitArtworks[index].layout_id} траси ${circuit.name}`
            : `Layout ${circuitArtworks[index].layout_id} outline of ${circuit.name}`} />
          <figcaption>{locale === 'uk' ? 'Історична конфігурація' : 'Historical layout'}: {circuitArtworks[index].layout_id} · <a href={circuitArtworks[index].source_url} target="_blank" rel="noopener noreferrer">{circuitArtworks[index].author} ↗</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{circuitArtworks[index].license} ↗</a></figcaption>
        </figure>}
        <span className={styles.readLink} aria-hidden="true">{s.circuitLink} ↗</span>
      </article>)}</StoryRail>
    </section>

    <section className={styles.machine} aria-labelledby="home-machine-title" data-story-reveal>
      <div><p className={styles.eyebrow}>{t.machine}</p><h2 id="home-machine-title">{s.machineTitle}</h2><p className={styles.note}>{s.machineNote}</p></div>
      <div className={styles.machineBody}>{focus && years.length > 1 ? <ComparisonLauncher id={focus.driver.id} name={focus.driver.name} years={years} locale={locale} /> : <a className={styles.textLink} href={path('/time-machine')}>{t.compare} ↗</a>}</div>
    </section>

    <section className={`${styles.section} ${styles.explorer}`} aria-labelledby="home-explorer-title" data-story-reveal>
      <div className={styles.explorerVisual}>{focus && associations.length > 0 ? <ConnectionPreview id={focus.driver.id} name={focus.driver.name} rows={associations} locale={locale} /> : <p>{t.noConnections}</p>}</div>
      <div><p className={styles.eyebrow}>{e.connections}</p><h2 id="home-explorer-title">{e.connectionsTitle}</h2><p className={styles.note}>{e.connectionsNote}</p><a className={styles.textLink} href={focus && years.length ? path(`/atlas?kind=driver&id=${focus.driver.id}&year=${years[0]}`) : path('/atlas')}>{e.atlas} ↗</a>
        <a className={styles.textLink} href={focus && years.length ? path(`/explorer/drivers/${focus.driver.id}?year=${years[0]}`) : path('/drivers')}>{focus && years.length ? t.graph : t.allDrivers} ↗</a></div>
    </section>
    <SourceAttribution locale={locale}>{focus?.career?.observations[0]?.release_tag ? `F1DB / ${focus.career.observations[0].release_tag}` : 'GRID ATLAS / F1DB'}</SourceAttribution>
  </div>;
}
