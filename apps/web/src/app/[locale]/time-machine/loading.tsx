import { NoScriptTextLink } from "@/components/explorer/text-link";
import { getTranslations } from "next-intl/server";
import styles from "./time-machine.module.css";

export default async function TimeMachineLoading() {
  const t = await getTranslations("UI");
  return (
    <section
      className={`page ${styles.page}`}
      aria-busy="true"
      aria-live="polite"
    >
      <p className="eyebrow">
        {t("archive")} / {t("timeMachineTitle")}
      </p>
      <h1>{t("timeMachineTitle")}</h1>
      <p role="status">{t("timeMachineLoading")}</p>
      <div className={styles.comparisonHero} aria-hidden="true">
        <div>1950</div>
        <div className={styles.heroYears}>◉ ───→ ◉</div>
      </div>
      <NoScriptTextLink />
    </section>
  );
}
