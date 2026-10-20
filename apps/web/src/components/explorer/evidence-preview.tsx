"use client";
import { useEffect, useState } from "react";
import { loadEvidencePreview, type EvidencePreview } from "./evidence-action";
import { explorerCopy, recordCountLabel } from "./copy";
import styles from "../explorer-graph.module.css";
export function EvidencePreviewPanel({
  driver,
  constructor,
  year,
  locale,
}: {
  driver: string;
  constructor: string;
  year: number;
  locale: "en" | "uk";
}) {
  const t = explorerCopy[locale];
  const [result, setResult] = useState<{
    key: string;
    data: EvidencePreview;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${driver}:${constructor}:${year}:${attempt}`;
  useEffect(() => {
    let current = true;
    loadEvidencePreview(driver, constructor, year)
      .then((data) => {
        if (current) setResult({ key, data });
      })
      .catch(() => {
        if (current) setResult({ key, data: { status: "error" } });
      });
    return () => {
      current = false;
    };
  }, [driver, constructor, year, attempt, key]);
  const data = result?.key === key ? result.data : null;
  return (
    <div className={styles.racePreview} aria-label={t.evidence}>
      <strong>{t.evidence}</strong>
      <div aria-live="polite" aria-busy={!data}>
        {!data ? (
          <p role="status">{t.loading}</p>
        ) : data.status === "error" ? (
          <>
            <p>{t.error}</p>
            <button onClick={() => setAttempt((value) => value + 1)}>
              {t.retry}
            </button>
          </>
        ) : data.races.length ? (
          <>
            <ol>
              {data.races.map((race) => (
                <li key={race.race_id}>
                  <span>{String(race.round).padStart(2, "0")}</span>
                  <a href={`/${locale}/races/${race.race_id}`}>
                    {race.official_name} ↗
                  </a>
                  <small>
                    {recordCountLabel(race.result_entries, locale, "entries")}
                  </small>
                </li>
              ))}
            </ol>
            <p>{t.preview}</p>
          </>
        ) : (
          <p>{t.noRaces}</p>
        )}
      </div>
      <noscript>
        <p>{t.more} ↓</p>
      </noscript>
    </div>
  );
}
