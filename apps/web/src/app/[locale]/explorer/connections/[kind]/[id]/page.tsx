import { getConnectionPage } from "@/lib/explorer-page";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; kind: string; id: string }>;
  searchParams: Promise<{ year?: string; offset?: string }>;
};
const validId = (s: string) =>
  /^[1-9][0-9]{0,18}$/.test(s) && BigInt(s) <= 9223372036854775807n;

export default async function CompleteConnections({
  params,
  searchParams,
}: PageProps) {
  const { locale, kind, id } = await params;
  const { year, offset } = await searchParams;
  if (
    !["uk", "en"].includes(locale) ||
    !["drivers", "constructors"].includes(kind) ||
    !validId(id) ||
    typeof year !== "string" ||
    !/^[0-9]{4}$/.test(year) ||
    Number(year) < 1950 ||
    Number(year) > 2200 ||
    (offset !== undefined &&
      (!/^(0|[1-9][0-9]{0,5})$/.test(offset) || Number(offset) > 100000))
  )
    notFound();
  const position = Number(offset ?? "0");
  const data = await getConnectionPage(
    kind as "drivers" | "constructors",
    id,
    Number(year),
    position,
  );
  const uk = locale === "uk";
  const base = `/${locale}/explorer/connections/${kind}/${id}?year=${year}&offset=`;
  const graphUrl = `/${locale}/explorer/${kind}/${id}?year=${year}`;
  const from = kind === "constructors" ? "constructor" : "driver";
  return (
    <section className="page">
      <p className="eyebrow">
        Explorer / {uk ? "Всі зв’язки сезону" : "All season connections"}
      </p>
      <h1>
        {data.focus.name} · {year}
      </h1>
      <p className="lead">
        {uk
          ? "Повний список спостережуваних зв’язків із записів результатів, сторінками по 25."
          : "Browse all observed result-record associations, 25 per page."}
      </p>
      <p role="status">
        {uk ? "Записи" : "Records"}: {data.total === 0 ? 0 : position + 1}–
        {Math.min(position + data.neighbors.length, data.total)} / {data.total}
      </p>
      {data.neighbors.length === 0 ? (
        <p>
          {uk ? "На цій сторінці немає записів." : "No records on this page."}
        </p>
      ) : (
        <ol start={position + 1}>
          {data.neighbors.map((n) => {
            const driverId = kind === "constructors" ? n.entity_id : id;
            const constructorId = kind === "constructors" ? id : n.entity_id;
            const evidence = `/${locale}/explorer/evidence/${driverId}/${constructorId}?year=${year}&from=${from}&selected=${n.entity_id}`;
            return (
              <li key={n.entity_id}>
                <strong>{n.name}</strong> — {n.races} {uk ? "гонок" : "races"},{" "}
                {n.result_entries} {uk ? "записів" : "result entries"}.{" "}
                <a href={evidence}>
                  {uk ? "Переглянути гонки →" : "View race evidence →"}
                </a>{" "}
                <a
                  href={`/${locale}/${data.neighbor_type === "driver" ? "drivers" : "constructors"}/${n.entity_id}`}
                >
                  {uk ? "Профіль" : "Profile"}
                </a>
              </li>
            );
          })}
        </ol>
      )}
      <nav aria-label={uk ? "Сторінки зв’язків" : "Connection pages"}>
        {position > 0 && (
          <a href={base + Math.max(0, position - 25)}>
            ← {uk ? "Назад" : "Previous"}
          </a>
        )}{" "}
        {data.next_offset !== null && (
          <a href={base + data.next_offset}>
            {uk ? "Наступні 25 →" : "Next 25 →"}
          </a>
        )}
      </nav>
      <p>
        <small>
          {uk
            ? "Зв’язки базуються на імпортованих результатах; це не підтвердження контрактів чи офіційних стартів."
            : "Imported result associations do not establish contracts or official starts."}
        </small>
      </p>
      <p>
        <a href={graphUrl}>← {uk ? "Повернутися до графа" : "Back to graph"}</a>
      </p>
    </section>
  );
}
