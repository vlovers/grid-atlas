import { getLocale } from 'next-intl/server';
import { getData, type Driver, type Season, type CatalogueEntity } from '@/lib/api';
import { routeMetadata } from '@/lib/seo';
import { atlasCopy } from '@/components/atlas/copy';
import { featuredIdentities } from '@/components/atlas/discovery-model';
import { ConnectionPreview } from '@/components/atlas/connection-preview';
import { ComparisonLauncher } from '@/components/atlas/comparison-launcher';
import { CareerSignature } from '@/components/atlas/career-signature';
import { SeasonBrowser } from '@/components/atlas/season-browser';
import { MotorsportArt } from '@/components/stories/motorsport-art';
import { StoryCard } from '@/components/stories/story-card';
import { StoryRail } from '@/components/stories/story-rail';
import { storyCopy } from '@/components/stories/copy';
import { openingRecord, sharedSeason } from '@/components/stories/story-model';
import type { DriverCareer, DriverSeason } from '@/components/driver/showcase-model';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';
export const generateMetadata = async () => routeMetadata(await getLocale(), '/');

export default async function Home() {
  const locale = await getLocale() as 'uk' | 'en';
  const t = atlasCopy[locale]; const s = storyCopy[locale];
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
  const focus = featured[0];
  const years = [...new Set(focus?.years.map(row => row.year) ?? [])].sort((a, b) => a - b);
  const associations = [...new Map((focus?.career?.participation ?? []).map(row => [row.related_id, row])).values()];
  const moments = featured.flatMap(item => { const moment = openingRecord(item.career); return moment ? [{ ...item, moment }] : []; });
  const cover = moments[0];
  const pairYear = focus && paired ? sharedSeason(focus.years, paired.years) : null;
  const path = (value: string) => `/${locale}${value}`;
  const num = (n: number) => new Intl.NumberFormat(locale).format(n);
  return <div className={styles.home} data-testid="atlas-home">
    <section className={styles.masthead} aria-labelledby="home-title">
      <div className={styles.heroArt}><MotorsportArt kind="velocity" /></div><div className={styles.heroShade} />
      <div className={styles.coverTop}><p className={styles.eyebrow}>{s.edition}</p><span>GRID ATLAS / 02</span></div>
      <div className={styles.heroCopy}><h1 id="home-title">{t.title}<br /><em>{t.titleEnd}</em></h1><p className={styles.lead}>{t.lead}</p>
        <div className={styles.actions}><a className={styles.button} href={cover ? path(`/races/${cover.moment.race.id}`) : '#atlas-seasons'}>{cover ? s.start : t.start} <span aria-hidden="true">↗</span></a><a href="#front-page">{s.more} ↓</a></div>
      </div>
      <div className={styles.heroBottom}>
        <form className={styles.search} action={path('/drivers')} role="search"><label htmlFor="home-search">{t.search}</label><div><input id="home-search" name="q" type="search" maxLength={100} placeholder={t.placeholder} /><button type="submit" aria-label={t.searchAction}>↗</button></div></form>
        {cover && <a className={styles.coverStory} href={path(`/drivers/${cover.driver.id}`)}><span>{s.cover}</span><strong>{cover.driver.name}</strong><span>{cover.driver.external_id} <span aria-hidden="true">↗</span></span></a>}
      </div>
      <p className={styles.artCredit}>{s.art} / {s.artNote}</p>
    </section>
    <div className={styles.editionStrip}><span>{t.live}</span><strong>{num(seasons.length)} {t.seasons}</strong><span>{seasons.length ? `${Math.min(...seasons.map(row => row.year))}—${Math.max(...seasons.map(row => row.year))}` : '—'}</span><a href={path('/sources')}>{locale === 'uk' ? 'Джерела' : 'Sources'} ↗</a></div>

    <section id="front-page" className={styles.section} aria-labelledby="home-moments-title" data-story-reveal>
      <SectionHeading kicker={s.featured} title={s.moments} note={s.momentNote} id="home-moments-title" />
      {moments.length ? <StoryRail label={s.moments} locale={locale}>{moments.map(({ driver, career, moment }, index) => <StoryCard key={driver.id}
        href={path(`/races/${moment.race.id}`)} title={moment.race.name} eyebrow={`${driver.name} / ${career?.milestones.first_win ? s.firstWin : s.firstRace}`}
        year={moment.race.year} action={s.openRace} detail={s.artNote} kind={index === 1 ? 'grid' : 'velocity'} tone={index === 1 ? 'gold' : index === 2 ? 'mint' : 'coral'} />)}</StoryRail> : <p className={styles.note}>{s.noMoments}</p>}
    </section>

    <section className={styles.people} aria-labelledby="home-drivers-title" data-story-reveal>
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{s.people}</p><h2 id="home-drivers-title">{s.peopleTitle}</h2></div><p className={styles.note}>{s.peopleNote}</p></div>
      <div className={styles.driverGallery}>{featured.map(({ driver, career }, index) => <article key={driver.id} className={styles.driverCover}>
        <MotorsportArt kind={index === 1 ? 'grid' : index === 2 ? 'velocity' : 'helmet'} tone={index === 1 ? 'gold' : index === 2 ? 'violet' : 'mint'} />
        <span className={styles.coverYear} aria-hidden="true">{career?.summary.first_season ?? '—'}</span>
        <a href={path(`/drivers/${driver.id}`)}><span className={styles.driverKicker}>{t.dossier} / 0{index + 1}</span><div><p>{career?.summary.first_season ?? '—'}—{career?.summary.last_season ?? '—'}</p><h3>{driver.name}</h3><span className={styles.readLink}>{s.more} <span aria-hidden="true">↗</span></span></div></a>
      </article>)}</div>
      {!featured.length && <p className={styles.note}>{t.noDrivers}</p>}<div className={styles.galleryFooter}><p>{s.artNote}</p><a className={styles.textLink} href={path('/drivers')}>{t.allDrivers} ↗</a></div>
    </section>

    <section id="atlas-seasons" className={`${styles.section} ${styles.era}`} aria-labelledby="home-seasons-title" data-story-reveal>
      <SectionHeading kicker={s.eras} title={s.erasTitle} note={s.erasNote} id="home-seasons-title" /><SeasonBrowser seasons={seasons} locale={locale} /><a className={styles.textLink} href={path('/seasons')}>{t.allSeasons} ↗</a>
    </section>

    <section className={styles.narrative} aria-labelledby="home-narrative-title" data-testid="season-perspectives" data-story-reveal>
      <div className={styles.narrativeArt}><MotorsportArt kind="duel" tone="gold" /></div>
      <div className={styles.narrativeCopy}><p className={styles.eyebrow}>{s.narrative}</p><h2 id="home-narrative-title">{pairYear ? s.narrativeTitle : s.narrativeEmpty}</h2><p className={styles.note}>{pairYear ? s.narrativeNote : s.narrativeEmptyNote}</p>
        {pairYear && focus && paired ? <div className={styles.pairLinks}>{[focus, paired].map(item => <a key={item.driver.id} href={path(`/explorer/drivers/${item.driver.id}?year=${pairYear}`)}><span>{pairYear} / {s.perspective}</span><strong>{item.driver.name} ↗</strong></a>)}</div> : <a className={styles.button} href={path('/drivers')}>{t.allDrivers} ↗</a>}
      </div>{pairYear && <span className={styles.narrativeYear} aria-hidden="true">{pairYear}</span>}
    </section>

    <section className={styles.section} aria-labelledby="home-circuits-title" data-story-reveal>
      <SectionHeading kicker={s.circuits} title={s.circuitsTitle} note={s.circuitsNote} id="home-circuits-title" />
      <StoryRail label={s.circuitsTitle} locale={locale}>{circuits.map((circuit, index) => <StoryCard key={circuit.id} href={path(`/circuits/${circuit.id}`)} title={circuit.name} eyebrow={s.circuits} action={s.circuitLink}
        kind="apex" tone={index === 0 ? 'mint' : index === 1 ? 'coral' : 'violet'} detail={s.circuitArt} />)}</StoryRail>
    </section>

    <section className={styles.machine} aria-labelledby="home-machine-title" data-story-reveal>
      <div className={styles.machineArt}><MotorsportArt kind="grid" tone="violet" /><span aria-hidden="true">{years[0] ?? '↔'}<br />{years.at(-1) ?? '↔'}</span></div>
      <div className={styles.machineBody}><p className={styles.eyebrow}>{t.machine}</p><h2 id="home-machine-title">{s.machineTitle}</h2><p className={styles.note}>{s.machineNote}</p>
        {focus && years.length > 1 ? <ComparisonLauncher id={focus.driver.id} name={focus.driver.name} years={years} locale={locale} /> : <a className={styles.button} href={path('/time-machine')}>{t.compare} ↗</a>}
      </div>
    </section>

    <section className={`${styles.section} ${styles.explorer}`} aria-labelledby="home-explorer-title" data-story-reveal>
      <div className={styles.explorerArt}><MotorsportArt kind="apex" tone="violet" />{focus && associations.length > 0 ? <ConnectionPreview id={focus.driver.id} name={focus.driver.name} rows={associations} locale={locale} /> : <p>{t.noConnections}</p>}</div>
      <div><p className={styles.eyebrow}>{t.explorer}</p><h2 id="home-explorer-title">{s.explorerTitle}</h2><p className={styles.note}>{s.explorerNote}</p><a className={styles.button} href={focus && years.length ? path(`/explorer/drivers/${focus.driver.id}?year=${years[0]}`) : path('/drivers')}>{focus && years.length ? t.graph : t.allDrivers} ↗</a></div>
    </section>
    <aside className={styles.sources}><div><p className={styles.eyebrow}>{s.records}</p><h2>{s.next}</h2><p>{t.sourcesNote}</p><a className={styles.textLink} href={path('/sources')}>{locale === 'uk' ? 'Джерела архіву' : 'Archive sources'} ↗</a></div>
      {focus && <details><summary>{s.graphic}</summary><CareerSignature seasons={focus.years} name={focus.driver.name} locale={locale} /></details>}
    </aside>
  </div>;
}
function SectionHeading({ kicker, title, note, id }: { kicker: string; title: string; note?: string; id: string }) {
  return <header className={styles.sectionHead}><div><p className={styles.eyebrow}>{kicker}</p><h2 id={id}>{title}</h2></div>{note && <p className={styles.note}>{note}</p>}</header>;
}
