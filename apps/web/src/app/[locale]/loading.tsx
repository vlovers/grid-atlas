import { getTranslations } from "next-intl/server";
import { NoScriptTextLink } from "@/components/explorer/text-link";
export default async function Loading() {
  const t = await getTranslations("UI");
  return (
    <section className="page" role="status" aria-live="polite">
      <p className="eyebrow">GRID ATLAS / {t("archive")}</p>
      <h1>{t("loadingTitle")}</h1>
      <p>{t("loadingBody")}</p>
      <NoScriptTextLink />
    </section>
  );
}
