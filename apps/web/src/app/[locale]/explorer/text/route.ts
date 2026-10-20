import { getConnectionPage } from "@/lib/explorer-page";
import { getTimeMachineComparison } from "@/lib/time-machine-api";
import { getPairRaceEvidence } from "@/lib/explorer-race-evidence";
import { comparisonRows } from "../../time-machine/comparison-model";
import { machineCopy } from "../../time-machine/copy";
import { explorerCopy } from "@/components/explorer/copy";
import { htmlText as h } from "@/components/explorer/text-model";
export const dynamic = "force-dynamic";
const id = (value: string | null): value is string =>
  !!value &&
  /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n;
const year = (value: string | null): value is string =>
  !!value &&
  /^\d{4}$/.test(value) &&
  Number(value) >= 1950 &&
  Number(value) <= 2200;
/** Public, bounded HTML fallback for browsers that cannot reveal streamed React content. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "uk" && rawLocale !== "en")
    return new Response("Not found", { status: 404 });
  const locale = rawLocale;
  const uk = locale === "uk";
  const t = explorerCopy[locale];
  const m = machineCopy[locale];
  const q = new URL(request.url).searchParams;
  const kind = q.get("kind") ?? "driver";
  const focus = q.get("id");
  const y = q.get("year");
  const earlier = q.get("from");
  const later = q.get("to");
  const experience = q.get("experience") ?? "network";
  const route = kind === "constructor" ? "constructors" : "drivers";
  const a = (href: string, label: string) =>
    `<a href="${h(href)}">${h(label)}</a>`;
  let body: string;
  let title = uk ? "Текстовий дослідник" : "Text explorer";
  let status = 200;
  try {
    if (
      experience === "network" &&
      id(focus) &&
      year(y) &&
      ["driver", "constructor"].includes(kind)
    ) {
      const offset = q.get("offset") ?? "0";
      if (!/^(0|[1-9][0-9]{0,5})$/.test(offset) || Number(offset) > 100000)
        throw new Error("Invalid page");
      const data = await getConnectionPage(
        route,
        focus,
        Number(y),
        Number(offset),
      );
      title = `${data.focus.name} · ${y}`;
      const selected =
        data.neighbors.find((n) => n.entity_id === q.get("selected")) ??
        data.neighbors[0];
      body = `<p>${h(t.slice)}</p><p>${data.total === 0 ? 0 : Number(offset) + 1}–${Math.min(Number(offset) + data.neighbors.length, data.total)} / ${data.total}</p><ul>${data.neighbors
        .map((node) => {
          const selection = new URLSearchParams(q);
          selection.set("selected", node.entity_id);
          const evidence = new URLSearchParams({
            experience: "evidence",
            driver: kind === "driver" ? focus : node.entity_id,
            constructor: kind === "constructor" ? focus : node.entity_id,
            year: y,
          });
          return `<li>${a(`/${locale}/explorer/text?${selection}`, node.name)} — ${node.races} ${uk ? "гонок" : "races"} / ${node.result_entries} ${uk ? "записів" : "entries"} · ${a(`/${locale}/explorer/text?${evidence}`, t.evidence)}</li>`;
        })
        .join("")}</ul>`;
      if (selected)
        body += `<section aria-label="${uk ? "Деталі зв’язку" : "Connection details"}"><h2>${h(selected.name)}</h2><p>${h(data.focus.name)} → ${h(selected.name)} · ${y}</p><dl><dt>${uk ? "Гонки з результатами" : "Races with results"}</dt><dd>${selected.races}</dd><dt>${uk ? "Записи результатів" : "Result entries"}</dt><dd>${selected.result_entries}</dd><dt>${uk ? "Гонки з переможними результатами" : "Races with winning results"}</dt><dd>${selected.winning_races}</dd></dl>${a(`/${locale}/explorer/${route}/${focus}?year=${y}&selected=${selected.entity_id}`, uk ? "Відкрити інтерактивний зв’язок" : "Open interactive connection")}</section>`;
      else body += `<p>${h(t.empty)}</p>`;
      body += `<nav aria-label="${uk ? "Сторінки зв’язків" : "Connection pages"}">`;
      for (const [position, label] of [
        [
          Number(offset) > 0 ? Math.max(0, Number(offset) - 25) : null,
          uk ? "Назад" : "Previous",
        ],
        [data.next_offset, uk ? "Наступні 25" : "Next 25"],
      ] as const)
        if (position !== null) {
          const next = new URLSearchParams(q);
          next.set("offset", String(position));
          next.delete("selected");
          body += a(`/${locale}/explorer/text?${next}`, label) + " ";
        }
      body += "</nav>";
    } else if (
      experience === "machine" &&
      id(focus) &&
      year(earlier) &&
      year(later) &&
      Number(earlier) < Number(later) &&
      ["driver", "constructor"].includes(kind)
    ) {
      const data = await getTimeMachineComparison(
        kind as "driver" | "constructor",
        focus,
        Number(earlier),
        Number(later),
      );
      title = `${data.focus.name} · ${earlier} / ${later}`;
      body = `<p>${h(m.note)}</p><table><caption>${h(m.detail)}</caption><thead><tr><th>${uk ? "Зв’язок" : "Association"}</th><th>${h(earlier)}</th><th>${h(later)}</th></tr></thead><tbody>${comparisonRows(
        data,
      )
        .map((row) => {
          const counts = (side: "from" | "to", y: string) => {
            const c = row[side];
            const eq = new URLSearchParams({
              experience: "evidence",
              driver: kind === "driver" ? focus : row.entity_id,
              constructor: kind === "constructor" ? focus : row.entity_id,
              year: y,
            });
            return c
              ? `${c.races} / ${c.result_entries} / ${c.winning_races}<br>${a(`/${locale}/explorer/text?${eq}`, m.evidence)}`
              : h(m.unknownNote);
          };
          return `<tr><th scope="row">${h(row.name)}<br><small>${h(m[row.status])}</small></th><td>${counts("from", earlier)}</td><td>${counts("to", later)}</td></tr>`;
        })
        .join(
          "",
        )}</tbody></table><p>${uk ? "Лічильники: гонки / записи результатів / гонки з переможним результатом." : "Counts: races / result entries / races with winning results."}</p>`;
      body += `<p>${a(`/${locale}/time-machine?kind=${kind}&id=${focus}&from=${earlier}&to=${later}`, m.share)}</p>`;
    } else if (
      experience === "evidence" &&
      id(q.get("driver")) &&
      id(q.get("constructor")) &&
      year(y)
    ) {
      const evidence = await getPairRaceEvidence(
        q.get("driver")!,
        q.get("constructor")!,
        Number(y),
      );
      title = `${evidence.driver.name} → ${evidence.constructor.name} · ${y}`;
      body = `<h2>${h(t.evidence)}</h2><ol>${evidence.races.map((r) => `<li>${h(r.round)} · ${a(`/${locale}/races/${r.race_id}`, r.official_name)} — ${h(r.result_entries)} ${uk ? "записів" : "entries"}</li>`).join("")}</ol>${evidence.races.length ? "" : `<p>${h(t.noRaces)}</p>`}${evidence.truncated ? `<p>${h(uk ? "Показано перші 100 гонок." : "First 100 races shown.")}</p>` : ""}<p>${h(uk ? "Імпортовані результати основних гонок." : "Imported main-race results.")}</p>`;
    } else {
      status = 400;
      body = `<p>${uk ? "Некоректний запит. Відкрийте текстовий вигляд із поточної сторінки дослідження." : "Invalid request. Open the text view from the current exploration page."}</p>`;
    }
  } catch {
    status = 503;
    body = `<p role="alert">${uk ? "Дані тимчасово недоступні. Спробуйте пізніше." : "Data is temporarily unavailable. Please try again later."}</p>`;
  }
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${h(title)} · Grid Atlas</title><style>body{margin:0;background:#0B0F14;color:#F3F0E8;font:1rem/1.7 Arial,sans-serif}main{max-width:70rem;margin:auto;padding:2rem 5vw}h1{font-size:clamp(2rem,6vw,4rem);line-height:1.1;overflow-wrap:anywhere}a{color:#f99b8d;text-underline-offset:.2em}a:focus-visible{outline:3px solid currentColor}li{padding:.7rem 0;border-bottom:1px solid #344853}table{border-collapse:collapse;width:100%}th,td{padding:.8rem;text-align:left;border:1px solid #526775;overflow-wrap:anywhere}section{padding:1.5rem;border:1px solid #526775;margin:2rem 0}small{color:#b2c2cb}@media(max-width:600px){th,td{padding:.4rem;font-size:.85rem}}@media(forced-colors:active){a{color:LinkText}}</style></head><body><main><nav>${a(`/${locale}`, "GRID ATLAS")}</nav><p>${uk ? "Текстовий вигляд · без JavaScript" : "Text view · no JavaScript"}</p><h1>${h(title)}</h1>${body}<p>${h(m.unknownNote)} ${h(m.note)}</p><p>${a("https://github.com/f1db/f1db", "F1DB")} · ${a("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0")} · ${a(`/${locale}/sources`, uk ? "Джерела та покриття" : "Sources and coverage")}</p></main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
