import { test, expect } from "@playwright/test";
import { historyAtlasCopy } from "../../apps/web/src/components/history-atlas/copy";
import { explorerCopy } from "../../apps/web/src/components/explorer/copy";
for (const locale of ["en", "uk"] as const) {
  const t = historyAtlasCopy[locale];
  test(`${locale}: Atlas search, focus pivot, trail restoration, evidence and season gaps`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${locale}/atlas`);
    await page.getByRole("searchbox", { name: t.query }).fill("driver-a");
    await page.getByRole("button", { name: new RegExp(t.find) }).click();
    await page.getByRole("list", { name: t.results }).getByRole("link").click();
    const atlas = page.getByTestId("history-atlas");
    await expect(atlas).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: t.timeline }),
    ).toContainText("1950");
    const inspector = atlas.getByRole("complementary");
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      "alpha",
    );
    await expect(inspector.getByRole("definition")).toHaveText(["1", "1", "1"]);
    await expect(
      inspector.getByRole("link", { name: /Synthetic shared-car race/ }),
    ).toHaveAttribute("href", `/${locale}/races/1`);
    await inspector.getByRole("link", { name: new RegExp(t.pivot) }).click();
    await expect(atlas.getByRole("heading", { level: 2 })).toHaveText(
      "alpha · 1950",
    );
    await expect(page).toHaveURL(
      /kind=constructor.*id=1.*year=1950.*selected=1.*trail=/,
    );
    const list = atlas.locator("#atlas-connections");
    await list.getByRole("button").filter({ hasText: "driver-b" }).click();
    await expect(page).toHaveURL(/selected=2/);
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      "driver-b",
    );
    const share = (await inspector
      .getByRole("link", { name: new RegExp(t.share) })
      .getAttribute("href"))!;
    await page.reload();
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      "driver-b",
    );
    await page
      .getByRole("navigation", { name: t.trail })
      .getByRole("link", { name: /driver-a/ })
      .click();
    await expect(page).toHaveURL(/kind=driver.*id=1.*year=1950.*selected=1/);
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      "alpha",
    );
    await page.goto(share);
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      "driver-b",
    );
    const season = page.getByRole("combobox", { name: t.season, exact: true });
    await season.selectOption("1951");
    await page.getByRole("button", { name: new RegExp(t.open) }).click();
    await expect(
      atlas.getByRole("status").filter({ hasText: t.empty }),
    ).toBeVisible();
    await expect(atlas).toContainText(t.emptyNote);
    await page.goBack();
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      "driver-b",
    );
    expect(errors).toEqual([]);
  });
  test(`${locale}: React Flow controls, keyboard selection, same-document history and reduced motion`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/${locale}/atlas?kind=constructor&id=1&year=1950&selected=1`,
    );
    const canvas = page.getByTestId("atlas-canvas");
    const viewport = canvas.locator(".react-flow__viewport");
    await expect(canvas.locator(".react-flow__node")).toHaveCount(3);
    for (const node of await canvas.locator(".react-flow__node").all()) {
      const text = (await node.locator('[class*="identity"]').textContent())!
        .replace(/\s+/g, " ")
        .trim();
      await expect(node).toHaveAccessibleName(text);
    }
    const original = await viewport.getAttribute("style");
    await canvas.getByRole("button", { name: t.zoomIn, exact: true }).click();
    await expect(viewport).not.toHaveAttribute("style", original!);
    await canvas.getByRole("button", { name: t.fit, exact: true }).click();
    const b = canvas.getByRole("button", { name: /driver-b/ });
    await b.focus();
    await b.press("Enter");
    await expect(page).toHaveURL(/selected=2/);
    await expect(
      page.getByRole("complementary").getByRole("heading", { level: 3 }),
    ).toHaveText("driver-b");
    await expect(canvas.locator(".animated")).toHaveCount(0);
    await page
      .getByTestId("history-atlas")
      .locator("#atlas-connections button")
      .filter({ hasText: "driver-a" })
      .click();
    await page.goBack();
    await expect(
      page.getByRole("complementary").getByRole("heading", { level: 3 }),
    ).toHaveText("driver-b");
    if (!isMobile) {
      await canvas.scrollIntoViewIfNeeded();
      const box = (await canvas.boundingBox())!;
      await page.mouse.move(box.x + 20, box.y + 20);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 60);
      await page.mouse.up();
      await expect(viewport).not.toHaveAttribute("style", original!);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
  test(`${locale}: bounded search pagination, empty results and invalid selections`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/atlas?q=Synthetic&kind=driver`);
    await expect(
      page.getByRole("list", { name: t.results }).getByRole("listitem"),
    ).toHaveCount(12);
    await page.getByRole("link", { name: new RegExp(t.next) }).click();
    await expect(page).toHaveURL(/offset=12/);
    await page.getByRole("link", { name: new RegExp(t.previous) }).click();
    await page.goto(`/${locale}/atlas?q=doesnotexist`);
    await expect(page.getByRole("status")).toHaveText(t.noResults);
    await page.goto(`/${locale}/atlas?id=1&kind=driver&year=garbage`);
    await expect(
      page.getByRole("alert").filter({ hasText: t.invalid }),
    ).toBeVisible();
    await page.goto(
      `/${locale}/atlas?id=1&year=1950&selected=999&trail=https://evil.example`,
    );
    await expect(page.getByTestId("history-atlas")).toContainText(
      t.invalidSelected,
    );
    await expect(
      page.getByRole("status").filter({ hasText: t.invalidTrail }),
    ).toBeVisible();
    await page.goto(`/${locale}/atlas?id=999999&year=1950`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      locale === "en" ? /not found/i : /знайдено/i,
    );
  });
  test(`${locale}: unavailable archive retains safe recoverable failure`, async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:3341/${locale}/atlas?id=1&year=1950`);
    await expect(
      page.getByRole("alert").filter({ hasText: t.unavailable }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: t.retry })).toBeVisible();
  });
  test(`${locale}: explicit Atlas URL has an operational no-script text alternative`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(
      `http://127.0.0.1:3340/${locale}/atlas?kind=constructor&id=1&year=1950&selected=2`,
    );
    await page.getByRole("link", { name: t.text }).first().click();
    await expect(page.getByRole("heading", { name: "driver-b" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "CC BY 4.0", exact: true }),
    ).toBeVisible();
    await context.close();
  });
  test(`${locale}: race-preview loading and failure retain the evidence link and retry successfully`, async ({
    page,
  }) => {
    const e = explorerCopy[locale];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/atlas?**", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await gate;
      await route.abort();
    });
    await page.goto(`/${locale}/atlas?kind=driver&id=1&year=1950`);
    const preview = page.getByLabel(e.evidence);
    await expect(preview).toContainText(e.loading);
    release();
    await expect(preview).toContainText(e.error);
    await expect(
      page
        .getByRole("complementary")
        .getByRole("link", { name: new RegExp(t.evidence) }),
    ).toBeVisible();
    await page.unrouteAll();
    await preview.getByRole("button", { name: e.retry }).click();
    await expect(
      preview.getByRole("link", { name: /Synthetic shared-car race/ }),
    ).toBeVisible();
  });
  test(`${locale}: locale switching, empty careers, forced colors and 200 percent reflow preserve the map journey`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/atlas?kind=constructor&id=1&year=1950&selected=2&trail=driver:1:1950:1`,
    );
    await expect(
      page.getByTestId("atlas-canvas").locator(".react-flow__node"),
    ).toHaveCount(3);
    await page.emulateMedia({
      forcedColors: "active",
      reducedMotion: "reduce",
    });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(
      page.getByRole("complementary").getByRole("heading", { level: 3 }),
    ).toHaveText("driver-b");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("link", {
        name: locale === "en" ? "УКР — Українська" : "EN — English",
        exact: true,
      })
      .click();
    const otherLocale = locale === "en" ? "uk" : "en";
    await expect(page).toHaveURL(
      new RegExp(`/${otherLocale}/atlas\\?.*selected=2.*trail=`),
    );
    await expect(page.locator("html")).toHaveAttribute("lang", otherLocale);
    await expect(
      page
        .getByRole("complementary", {
          name: historyAtlasCopy[otherLocale].selected,
        })
        .getByRole("heading", { level: 3 }),
    ).toHaveText("driver-b");
    await page.goto(`/${locale}/atlas?kind=driver&id=3`);
    await expect(
      page.getByRole("status").filter({ hasText: t.noYears }),
    ).toBeVisible();
  });
}
