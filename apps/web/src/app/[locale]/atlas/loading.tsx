import { getLocale } from "next-intl/server";
import { historyAtlasCopy } from "@/components/history-atlas/copy";
import { NoScriptTextLink } from "@/components/explorer/text-link";
export default async function LoadingAtlas() {
  const locale = await getLocale();
  const t = historyAtlasCopy[locale === "en" ? "en" : "uk"];
  // Resolve the fallback as one fragment: do not stream another async segment
  // inside the loading boundary while the map itself is being revealed.
  const textLink = await NoScriptTextLink();
  return (
    <section className="page" role="status">
      <p className="eyebrow">GRID ATLAS</p>
      <h1>{t.loading}</h1>
      {textLink}
    </section>
  );
}
