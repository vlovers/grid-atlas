import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const mode = process.argv[2] || "after";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:3393";
const api = process.env.PREVIEW_API || "http://127.0.0.1:3392";
const dir = "docs/design/interactive-batch2/screenshots";
const data = async (path) => (await (await fetch(`${api}${path}`)).json()).data;
const senna = (await data("/api/drivers?q=ayrton-senna&limit=10")).find(
  (r) => r.external_id === "ayrton-senna",
);
const cooper = (await data("/api/constructors?q=cooper&limit=10")).find(
  (r) => r.external_id === "cooper",
);
if (!senna || !cooper) throw new Error("Pinned archive required");
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
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
      for (const [name, path] of [
        ["explorer", `explorer/drivers/${senna.id}?year=1993`],
        ["explorer-dense", `explorer/constructors/${cooper.id}?year=1960`],
        [
          "time-machine",
          `time-machine?kind=driver&id=${senna.id}&from=1987&to=1988`,
        ],
      ]) {
        await page.goto(`${base}/${locale}/${path}`);
        await page
          .getByRole("heading", { level: 1, name: /^(?!Loading|Завантаження)/ })
          .waitFor();
        if (name.startsWith("explorer"))
          await page.getByRole("complementary").waitFor({ state: "visible" });
        else
          await page
            .getByRole("heading", { level: 2, name: senna.name })
            .waitFor();
        if (mode === "after" && name.startsWith("explorer"))
          await page
            .getByRole("complementary")
            .locator("ol li")
            .first()
            .waitFor();
        await page.screenshot({
          path: `${dir}/${mode}-${name}-${locale}-${device}.jpg`,
          type: "jpeg",
          quality: 86,
          fullPage: true,
        });
        if (mode === "after") {
          const target = name.startsWith("explorer")
            ? page.getByTestId("network-experience")
            : page.getByTestId("comparison-stage");
          await target.evaluate((el) => el.scrollIntoView({ block: "start" }));
          await page.screenshot({
            path: `${dir}/focus-${name}-${locale}-${device}.jpg`,
            type: "jpeg",
            quality: 86,
          });
        }
        console.log(mode, locale, device, name);
      }
      await page.close();
    }
} finally {
  await browser.close();
}
