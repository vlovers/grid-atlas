import { notFound } from "next/navigation";
import {
  getConstructorExplorerGraph,
  getExplorerGraph,
} from "@/lib/explorer-api";
import ExplorerGraph from "../explorer-graph";
import { explorerCopy } from "./copy";
import styles from "../explorer-graph.module.css";
export type ExplorerPageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{
    year?: string | string[];
    selected?: string | string[];
  }>;
};
const validId = (value: string) =>
  /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n;
const validYear = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9]{4}$/.test(value) &&
  Number(value) >= 1950 &&
  Number(value) <= 2200;
export async function SeasonExplorer({
  params,
  searchParams,
  kind,
}: ExplorerPageProps & { kind: "driver" | "constructor" }) {
  const { id, locale: rawLocale } = await params;
  if (!validId(id) || !["en", "uk"].includes(rawLocale)) notFound();
  const locale = rawLocale as "en" | "uk";
  const uk = locale === "uk";
  const t = explorerCopy[locale];
  const query = await searchParams;
  const selected =
    typeof query.selected === "string" && validId(query.selected)
      ? query.selected
      : undefined;
  const year = validYear(query.year) ? Number(query.year) : null;
  const graph =
    year === null
      ? null
      : await (kind === "driver"
          ? getExplorerGraph(id, year)
          : getConstructorExplorerGraph(id, year));
  const focus = graph?.nodes.find((node) => node.key === graph.focus);
  const focusPath = `/${locale}/${kind === "driver" ? "drivers" : "constructors"}/${id}`;
  return (
    <section className={`page ${styles.page}`}>
      <header className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>{t.kicker}</p>
          <h1>{focus?.name ?? t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <form method="get" className={styles.yearForm}>
          <label htmlFor="explorer-year">
            {uk ? "Сезон" : "Season"}
            <input
              id="explorer-year"
              name="year"
              type="number"
              min="1950"
              max="2200"
              step="1"
              defaultValue={year ?? ""}
              required
            />
          </label>
          <button type="submit">{uk ? "Показати" : "Explore"} ↗</button>
        </form>
      </header>
      {query.year !== undefined && year === null && (
        <p role="alert">
          {uk
            ? "Вкажіть рік від 1950 до 2200."
            : "Choose a year from 1950 to 2200."}
        </p>
      )}
      <nav
        className={styles.journeyLinks}
        aria-label={uk ? "Подальше дослідження" : "Continue exploring"}
      >
        {year !== null && <a href={`/${locale}/atlas?kind=${kind}&id=${id}&year=${year}${selected ? `&selected=${selected}` : ''}`}>{uk ? 'Відкрити Атлас історії' : 'Open History Atlas'} ↗</a>}
        <a href={focusPath}>
          ←{" "}
          {kind === "driver"
            ? uk
              ? "Повернутися до пілота"
              : "Back to driver"
            : uk
              ? "Повернутися до конструктора"
              : "Back to constructor"}
        </a>
        {year !== null && (
          <>
            <a href={`/${locale}/seasons/${year}`}>
              {t.season} {year} ↗
            </a>
            <a
              href={`/${locale}/time-machine?kind=${kind}&id=${id}&from=${year === 2200 ? 2199 : year}&to=${year === 2200 ? 2200 : year + 1}`}
            >
              {t.machine} ↗
            </a>
          </>
        )}
      </nav>
      {graph && (
        <>
          {graph.edges.length > 0 ? (
            <ExplorerGraph
              key={`${kind}:${id}:${year}`}
              graph={graph}
              locale={locale}
              selectedId={selected}
            />
          ) : (
            <div className={styles.empty} role="status">
              <p>{year}</p>
              <h2>{t.emptyTitle}</h2>
              <p>
                {kind === "driver"
                  ? uk
                    ? "У цьому сезоні немає записаних результатів для пілота."
                    : "No recorded results for this driver in this season."
                  : uk
                    ? "У цьому сезоні немає записаних результатів для конструктора."
                    : "No recorded results for this constructor in this season."}
              </p>
              <p>{t.empty}</p>
            </div>
          )}
          {graph.truncated && (
            <p role="status">
              {kind === "driver"
                ? uk
                  ? `Показано лише перші ${graph.limit} конструкторів.`
                  : `Showing only the first ${graph.limit} constructors.`
                : uk
                  ? `Показано лише перших ${graph.limit} пілотів.`
                  : `Showing only the first ${graph.limit} drivers.`}{" "}
              <a
                href={`/${locale}/explorer/connections/${kind === "driver" ? "drivers" : "constructors"}/${id}?year=${year}&offset=25`}
              >
                {uk
                  ? "Переглянути решту зв’язків →"
                  : "Browse remaining connections →"}
              </a>
            </p>
          )}
          <p className={styles.caption}>
            {uk
              ? "Це зв’язки за результатами гонок, а не підтвердження офіційних стартів, контрактів або правонаступництва."
              : "These are result-record associations, not proof of official starts, contracts or team succession."}
          </p>
          <p className={styles.caption}>
            {kind === "driver"
              ? uk
                ? "Джерело обліку пілота"
                : "Driver identity source"
              : uk
                ? "Джерело ідентичності конструктора"
                : "Constructor identity source"}
            :{" "}
            <a
              href={graph.source.homepage_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {graph.source.attribution}
            </a>
            .{" "}
            {uk
              ? "Не є підтвердженням кожного окремого результату."
              : "Not per-result provenance."}
          </p>
        </>
      )}
    </section>
  );
}
