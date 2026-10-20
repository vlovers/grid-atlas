import { NoScriptTextLink } from "@/components/explorer/text-link";
import { getLocale, getTranslations } from "next-intl/server";
import { explorerCopy } from "@/components/explorer/copy";
import styles from "@/components/explorer-graph.module.css";
export default async function Loading() {
  const locale = (await getLocale()) as "en" | "uk";
  const t = await getTranslations("UI");
  return (
    <section
      className={`page ${styles.page}`}
      aria-busy="true"
      aria-live="polite"
    >
      <p className="eyebrow">{explorerCopy[locale].kicker}</p>
      <h1>{t("loadingTitle")}</h1>
      <p role="status">{t("loadingBody")}</p>
      <div className={styles.empty} aria-hidden="true">
        ↔
      </div>
      <NoScriptTextLink />
    </section>
  );
}
