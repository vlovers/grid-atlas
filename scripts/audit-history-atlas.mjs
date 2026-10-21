import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:3403";
const api = process.env.PREVIEW_API || "http://127.0.0.1:3402";
if (!process.env.AXE_SCRIPT)
  throw new Error(
    "Set AXE_SCRIPT to a locally installed axe-core 4.14.0 axe.min.js",
  );
const response = await fetch(`${api}/api/constructors?q=cooper&limit=10`);
if (!response.ok) throw new Error("Pinned archive API unavailable");
const cooper = (await response.json()).data.find(
  (d) => d.external_id === "cooper",
);
if (!cooper) throw new Error("Genuine pinned Cooper identity required");
const browser = await chromium.launch();
const rows = [];
try {
  for (const locale of ["uk", "en"])
    for (const width of [375, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await page.goto(
        `${base}/${locale}/atlas?kind=constructor&id=${cooper.id}&year=1960`,
      );
      await page
        .locator(".react-flow__node")
        .first()
        .waitFor({ state: "visible" });
      await page
        .getByRole("complementary")
        .locator("ol li")
        .first()
        .waitFor({ state: "visible" });
      await page.addScriptTag({ path: process.env.AXE_SCRIPT });
      const result = await page.evaluate(
        async () => await window.axe.run(document.getElementById("content")),
      );
      rows.push({
        locale,
        width,
        axeVersion: result.testEngine.version,
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        incomplete: result.incomplete.map((v) => v.id),
      });
      await page.close();
    }
} finally {
  await browser.close();
}
await writeFile(
  "docs/design/history-atlas/accessibility-check.json",
  JSON.stringify(rows, null, 2) + "\n",
);
console.log(rows);
if (rows.some((r) => r.violations.length))
  throw new Error(
    "Accessibility violations found; inspect accessibility-check.json",
  );
