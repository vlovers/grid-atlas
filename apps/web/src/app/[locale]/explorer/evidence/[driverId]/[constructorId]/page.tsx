import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getPairRaceEvidence } from "@/lib/explorer-race-evidence";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ driverId: string; constructorId: string; locale: string }>;
  searchParams: Promise<{
    year?: string | string[];
    from?: string | string[];
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

export default async function ExplorerRaceEvidencePage({
  params,
  searchParams,
}: Props) {
  const { driverId, constructorId, locale } = await params;
  const { year: rawYear, from, selected } = await searchParams;
  if (
    !validId(driverId) ||
    !validId(constructorId) ||
    !validYear(rawYear) ||
    !["uk", "en"].includes(locale)
  )
    notFound();
  const year = Number(rawYear);
  const uk = locale === "uk";
  const evidence = await getPairRaceEvidence(driverId, constructorId, year);
  // The selected neighbor is the driver for constructor focus and vice versa.
  // Ignore any mismatched or repeated query value rather than reflecting arbitrary input.
  const matchingNeighbor = from === "constructor" ? driverId : constructorId;
  const selectedQuery =
    selected === matchingNeighbor ? `&selected=${matchingNeighbor}` : "";
  const backHref =
    from === "constructor"
      ? `/explorer/constructors/${constructorId}?year=${year}${selectedQuery}`
      : `/explorer/drivers/${driverId}?year=${year}${selectedQuery}`;

  return (
    <section className="page">
      <p className="eyebrow">
        {uk ? "Історія Формули-1" : "Formula 1 history"} / Explorer
      </p>
      <h1>
        {uk
          ? "Гонки, що підтверджують зв’язок"
          : "Races behind this connection"}
      </h1>
      <p className="lead">
        {evidence.driver.name} → {evidence.constructor.name} · {year}
      </p>
      <p>
        {uk
          ? "Це гонки, де архів містить записи результатів для цієї пари пілота і конструктора. Це не підрахунок офіційних стартів або підтвердження контракту."
          : "These races have imported result records for this driver and constructor pair. They do not establish official starts or a contract."}
      </p>
      <nav
        aria-label={uk ? "Продовжити порівняння" : "Continue the comparison"}
      >
        <a
          href={`/${locale}/time-machine?kind=${from === "constructor" ? "constructor" : "driver"}&id=${from === "constructor" ? constructorId : driverId}&from=${year === 2200 ? 2199 : year}&to=${year === 2200 ? 2200 : year + 1}`}
        >
          {uk ? "Порівняти інший сезон →" : "Compare another season →"}
        </a>
      </nav>
      <h2>{uk ? "Записані гонки" : "Recorded races"}</h2>
      {evidence.races.length === 0 ? (
        <p>
          {uk
            ? "У вибраному сезоні немає записів для цієї пари."
            : "No recorded results for this pair in this season."}
        </p>
      ) : (
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label={uk ? "Таблиця гонок" : "Race table"}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">{uk ? "Раунд" : "Round"}</th>
                <th scope="col">{uk ? "Гонка" : "Race"}</th>
                <th scope="col">{uk ? "Дата" : "Date"}</th>
                <th scope="col">
                  {uk ? "Записи результатів" : "Result entries"}
                </th>
                <th scope="col">
                  {uk ? "Переможні записи" : "Winning entries"}
                </th>
              </tr>
            </thead>
            <tbody>
              {evidence.races.map((race) => (
                <tr key={race.race_id}>
                  <td>{race.round}</td>
                  <td>
                    <Link href={`/races/${race.race_id}`}>
                      {race.official_name} ↗
                    </Link>
                  </td>
                  <td>{race.race_date ?? "—"}</td>
                  <td>{race.result_entries}</td>
                  <td>{race.winning_result_entries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {evidence.truncated && (
        <p role="status">
          {uk
            ? `Показано лише перші ${evidence.limit} гонок.`
            : `Only the first ${evidence.limit} races are shown.`}
        </p>
      )}
      <p>
        <small>
          {uk
            ? "Дані: імпортовані результати основних гонок. Для окремих рядків немає незалежного посилання на джерело."
            : "Source scope: imported main-race results. Individual rows do not have independently linked provenance."}
        </small>
      </p>
      <p>
        <a href={`/${locale}${backHref}`}>
          ← {uk ? "Повернутися до графа" : "Back to graph"}
        </a>
      </p>
    </section>
  );
}
