"use client";
import { useLocale } from "next-intl";
import { historyAtlasCopy } from "@/components/history-atlas/copy";
export default function AtlasError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = historyAtlasCopy[useLocale() === "en" ? "en" : "uk"];
  return (
    <section className="page" role="alert">
      <h1>{t.unavailable}</h1>
      <p>{t.failure}</p>
      <button onClick={reset}>{t.retry}</button>
    </section>
  );
}
