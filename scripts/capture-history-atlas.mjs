import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:3403";
const api = process.env.PREVIEW_API || "http://127.0.0.1:3402";
const baseline = process.env.BASELINE_URL;
const dir = "docs/design/history-atlas/screenshots";
const data = async (path) => {
  const response = await fetch(`${api}${path}`);
  if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
  return (await response.json()).data;
};
const senna = (await data("/api/drivers?q=ayrton-senna&limit=10")).find(
  (d) => d.external_id === "ayrton-senna",
);
const cooper = (await data("/api/constructors?q=cooper&limit=10")).find(
  (d) => d.external_id === "cooper",
);
if (!senna || !cooper)
  throw new Error("A genuine pinned F1DB import is required");
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  for (const locale of ["en", "uk"])
    for (const [device, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 375, 812],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const [name, kind, id, year] of [
        ["driver", "driver", senna.id, 1988],
        ["dense", "constructor", cooper.id, 1960],
      ]) {
        await page.goto(
          `${base}/${locale}/atlas?kind=${kind}&id=${id}&year=${year}`,
        );
        const atlas = page.getByTestId("history-atlas");
        await atlas.waitFor({ state: "visible" });
        await page
          .locator(".react-flow__node")
          .first()
          .waitFor({ state: "visible" });
        await atlas
          .getByRole("complementary")
          .locator("ol li")
          .first()
          .waitFor({ state: "visible" });
        await page.screenshot({
          path: `${dir}/after-${name}-${locale}-${device}.jpg`,
          fullPage: true,
          type: "jpeg",
          quality: 86,
        });
        await atlas.evaluate((el) => el.scrollIntoView({ block: "start" }));
        await page.screenshot({
          path: `${dir}/focus-${name}-${locale}-${device}.jpg`,
          type: "jpeg",
          quality: 90,
        });
        report.push({
          locale,
          device,
          name,
          overflow: await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          nodes: await page.locator(".react-flow__node").count(),
          errors: [...errors],
        });
        if (baseline) {
          // Read-only old Explorer comparison; baseline must use the same pinned IDs.
          await page.goto(
            `${baseline}/${locale}/explorer/${kind === "driver" ? "drivers" : "constructors"}/${id}?year=${year}`,
          );
          await page
            .getByTestId("network-experience")
            .waitFor({ state: "visible" });
          await page
            .getByRole("complementary")
            .locator("ol li")
            .first()
            .waitFor({ state: "visible" });
          await page
            .getByTestId("network-experience")
            .evaluate((el) => el.scrollIntoView({ block: "start" }));
          await page.screenshot({
            path: `${dir}/before-${name}-${locale}-${device}.jpg`,
            type: "jpeg",
            quality: 86,
          });
        }
      }
      await page.close();
    }
} finally {
  await browser.close();
}
await writeFile(
  "docs/design/history-atlas/visual-check.json",
  JSON.stringify(report, null, 2) + "\n",
);
if (report.some((row) => row.overflow || row.errors.length))
  throw new Error("Visual smoke failed; inspect visual-check.json");
console.log(`Captured ${report.length} localized desktop/mobile Atlas views`);
