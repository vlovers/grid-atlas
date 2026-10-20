import { getLocale } from 'next-intl/server';
import { getData, type Driver, type Season } from '@/lib/api';
import { routeMetadata } from '@/lib/seo';
import { atlasCopy } from '@/components/atlas/copy';
import { featuredIdentities } from '@/components/atlas/discovery-model';
import { ConnectionPreview } from '@/components/atlas/connection-preview';
import { ComparisonLauncher } from '@/components/atlas/comparison-launcher';
import { CareerSignature } from '@/components/atlas/career-signature';
import { SeasonBrowser } from '@/components/atlas/season-browser';
import type { DriverCareer, DriverSeason } from '@/components/driver/showcase-model';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';
export const generateMetadata = async () => routeMetadata(await getLocale(), '/');

export default async function Home() {
  const locale = await getLocale() as 'uk' | 'en';
  const t = atlasCopy[locale];
  // A bounded selection resolved by canonical source IDs. Internal IDs vary by import.
  const names = ['ayrton-senna', 'juan-manuel-fangio', 'lewis-hamilton'];
  const [seasons, fallback, matches] = await Promise.all([
    getData<Season>('/api/seasons'), getData<Driver>('/api/drivers?limit=3'),
    Promise.all(names.map(name => getData<Driver>(`/api/drivers?q=${name}&limit=10`))),
  ]);
  const identities = featuredIdentities(matches.map((rows, i) => rows.find(d => d.external_id === names[i])), fallback);
  const featured = await Promise.all(identities.map(async driver => {
    const [careers, years] = await Promise.all([getData<DriverCareer>(`/api/drivers/${driver.id}/career?locale=${locale}`),
      getData<DriverSeason>(`/api/drivers/${driver.id}/seasons`)]);
    return { driver, career: careers[0], years };
  }));
  const focus = featured[0];
  const years = [...new Set(focus?.years.map(s => s.year) ?? [])].sort((a, b) => a - b);
  const associations = [...new Map((focus?.career?.participation ?? []).map(row => [row.related_id, row])).values()];
  const num = (n: number) => new Intl.NumberFormat(locale).format(n);
  const path = (value: string) => `/${locale}${value}`;
  return <div className={styles.home} data-testid="atlas-home">
    <section className={styles.masthead} aria-labelledby="home-title">
      <p className={styles.eyebrow}><span className={styles.signal} aria-hidden="true" />{t.exhibit} / 2.0</p>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}><h1 id="home-title">{t.title}<br /><em>{t.titleEnd}</em></h1>
          <p className={styles.lead}>{t.lead}</p>
          <form className={styles.search} action={path('/drivers')} role="search">
            <label htmlFor="home-search">{t.search}</label><div><input id="home-search" name="q" type="search" maxLength={100} placeholder={t.placeholder} /><button type="submit" aria-label={t.searchAction}>↗</button></div>
          </form>
          <div className={styles.actions}><a href="#atlas-seasons">{t.start} <span aria-hidden="true">↓</span></a><a href={path('/time-machine')}>Time Machine ↗</a></div>
        </div>
        <div className={styles.heroArt}>
          <span className={styles.orbit} aria-hidden="true" />
          {focus ? <><p className={styles.artLabel}>{t.focus} / 001</p><CareerSignature seasons={focus.years} name={focus.driver.name} locale={locale} />
            <a className={styles.artLink} href={path(`/drivers/${focus.driver.id}`)}>{t.dossier} <span aria-hidden="true">↗</span></a></> : <p>{t.noDrivers}</p>}
        </div>
      </div>
      <div className={styles.heroBottom}><p>{t.live}</p><p><strong>{num(seasons.length)}</strong> {t.seasons} <span aria-hidden="true">/</span> {seasons.length ? `${Math.min(...seasons.map(s => s.year))}—${Math.max(...seasons.map(s => s.year))}` : '—'}</p><a href="#atlas-seasons">{t.scroll} ↓</a></div>
    </section>

    <section id="atlas-seasons" className={styles.section} aria-labelledby="home-seasons-title">
      <SectionHeading kicker={t.era} title={t.eraTitle} note={t.eraNote} id="home-seasons-title" />
      <SeasonBrowser seasons={seasons} locale={locale} /><a className={styles.textLink} href={path('/seasons')}>{t.allSeasons} ↗</a>
    </section>

    <section className={styles.people} aria-labelledby="home-drivers-title">
      <div className={styles.section}><SectionHeading kicker={t.drivers} title={t.driversTitle} note={t.driversNote} id="home-drivers-title" /></div>
      {featured.length ? <div className={styles.driverGallery}>{featured.map(({ driver, career }, i) => <article key={driver.id} className={styles.dossier}>
        <div className={styles.dossierTop}><span>0{i + 1} / {t.identity}</span><span>{driver.external_id}</span></div>
        <span className={styles.ghostYear} aria-hidden="true">{career?.summary.first_season ?? '—'}</span>
        <div className={styles.dossierBody}><p>{career?.summary.first_season ?? '—'} — {career?.summary.last_season ?? '—'}</p>
          <h3><a href={path(`/drivers/${driver.id}`)}>{driver.name}</a></h3>
          {career && <dl><div><dt>{t.recordedRaces}</dt><dd>{num(career.summary.races)}</dd></div><div><dt>{t.winningRaces}</dt><dd>{num(career.summary.winning_races)}</dd></div></dl>}
          <a className={styles.textLink} href={path(`/drivers/${driver.id}`)}>{t.dossier} ↗</a>
        </div>
      </article>)}</div> : <p className={styles.section}>{t.noDrivers}</p>}
      <div className={styles.galleryFooter}><a className={styles.textLink} href={path('/drivers')}>{t.allDrivers} ↗</a></div>
    </section>

    <section className={`${styles.section} ${styles.constructors}`} aria-labelledby="home-constructor-title">
      <div><SectionHeading kicker={t.associations} title={t.constructorTitle} id="home-constructor-title" /><p className={styles.note}>{t.constructorNote}</p><a className={styles.textLink} href={path('/constructors')}>{t.constructors} ↗</a></div>
      <ol className={styles.constructorList}>{!associations.length && <li className={styles.emptyConnections}>{t.noConnections}</li>}{associations.slice(0, 5).map((row, i) => <li key={row.related_id}><span className={styles.order}>0{i + 1}</span><div><a href={path(`/constructors/${row.related_id}`)}>{row.related_name} ↗</a><p>{focus?.driver.name} / {row.year}</p></div><a className={styles.connectionLink} href={path(`/explorer/drivers/${focus!.driver.id}?year=${row.year}&selected=${row.related_id}`)} aria-label={`${t.evidence}: ${row.related_name}, ${row.year}`}>↗</a></li>)}</ol>
    </section>

    <section className={styles.machine} aria-labelledby="home-machine-title">
      <div><p className={styles.eyebrow}>{t.machine}</p><h2 id="home-machine-title">{t.machineTitle}</h2><p className={styles.note}>{t.machineNote}</p></div>
      <div className={styles.comparison}>
        {focus && years.length > 1 ? <ComparisonLauncher id={focus.driver.id} name={focus.driver.name} years={years} locale={locale} />
          : <a className={styles.button} href={path('/time-machine')}>{t.compare} ↗</a>}
      </div>
    </section>

    <section className={`${styles.section} ${styles.explorer}`} aria-labelledby="home-explorer-title">
      {focus && associations.length > 0 ? <ConnectionPreview id={focus.driver.id} name={focus.driver.name} rows={associations} locale={locale} /> : <p className={styles.note}>{t.noConnections}</p>}
      <div><p className={styles.eyebrow}>{t.explorer}</p><h2 id="home-explorer-title">{t.explorerTitle}</h2><p className={styles.note}>{t.explorerNote}</p>
        <a className={styles.button} href={focus && years.length ? path(`/explorer/drivers/${focus.driver.id}?year=${years[0]}`) : path('/drivers')}>{focus && years.length ? t.graph : t.allDrivers} ↗</a></div>
    </section>
    <aside className={styles.sources}><h2>{t.sources}</h2><p>{t.sourcesNote}</p><a className={styles.textLink} href={path('/sources')}>{locale === 'uk' ? 'Джерела архіву' : 'Archive sources'} ↗</a></aside>
  </div>;
}
function SectionHeading({ kicker, title, note, id }: { kicker: string; title: string; note?: string; id: string }) {
  return <header className={styles.sectionHead}><div><p className={styles.eyebrow}>{kicker}</p><h2 id={id}>{title}</h2></div>{note && <p className={styles.note}>{note}</p>}</header>;
}
