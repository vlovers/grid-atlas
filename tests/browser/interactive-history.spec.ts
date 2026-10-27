import { test, expect } from "@playwright/test";
import { explorerCopy } from "../../apps/web/src/components/explorer/copy";
import { machineCopy } from "../../apps/web/src/app/[locale]/time-machine/copy";
for (const locale of ["uk", "en"] as const) {
  const t = explorerCopy[locale];
  const m = machineCopy[locale];
  test(`${locale}: network zoom/pan/reset, live selection and history retain one document and exact evidence`, async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${locale}/explorer/constructors/1?year=1950`);
    const network = page.getByTestId("network-experience");
    await expect(network).toBeVisible();
    const transform = network.getByTestId("network-transform");
    const initial = await transform.getAttribute("transform");
    for (const node of await network.locator("[data-network-node]").all()) {
      const visible = await node.locator("text").allTextContents();
      const name = (await node.getAttribute("aria-label"))!;
      expect(name).toContain(visible.join("").replace(/\s+/g, " ").trim());
      await expect(node).toHaveAccessibleName(name);
    }
    await network.getByRole("button", { name: t.zoomIn, exact: true }).click();
    await expect(network.locator("output")).toHaveText("125%");
    await network.getByRole("button", { name: t.left, exact: true }).click();
    await expect(transform).not.toHaveAttribute("transform", initial!);
    await network.getByRole("button", { name: new RegExp(t.reset) }).click();
    await expect(transform).toHaveAttribute("transform", initial!);
    const viewport = network.getByRole("region", {
      name:
        locale === "uk"
          ? "Прокручувана карта зв’язків"
          : "Scrollable connection map",
    });
    await viewport.focus();
    await viewport.press("+");
    await expect(network.locator("output")).toHaveText("125%");
    await viewport.press("ArrowRight");
    await viewport.press("Home");
    await expect(transform).toHaveAttribute("transform", initial!);
    await viewport.press("Control+=");
    await expect(network.locator("output")).toHaveText("100%");
    if (!isMobile) {
      const box = (await viewport.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 40, box.y + 55);
      await page.mouse.up();
      await expect(transform).not.toHaveAttribute("transform", initial!);
      await network.getByRole("button", { name: new RegExp(t.reset) }).click();
      await expect(transform).toHaveAttribute("transform", initial!);
    }
    await page.evaluate(() => {
      document.documentElement.dataset.sameDocument = "yes";
    });
    await network
      .getByRole("button", { name: "driver-b", exact: true })
      .click();
    await expect(page).toHaveURL(/selected=2/);
    await expect(
      page.getByRole("complementary").getByRole("heading", { level: 2 }),
    ).toContainText("driver-b");
    await expect(
      page
        .getByRole("complementary")
        .getByRole("link", { name: /Synthetic shared-car race/ }),
    ).toHaveAttribute("href", `/${locale}/races/1`);
    await network
      .getByRole("button", { name: "driver-a", exact: true })
      .click();
    await page.goBack();
    await expect(
      network.getByRole("button", { name: "driver-b", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.goForward();
    await expect(page).toHaveURL(/selected=1/);
    await expect(
      network.getByRole("button", { name: "driver-a", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute(
      "data-same-document",
      "yes",
    );
    expect(errors).toEqual([]);
  });
  test(`${locale}: race preview failure is recoverable and canonical evidence remains available`, async ({
    page,
  }) => {
    await page.route("**/explorer/drivers/1?year=1950", (route) =>
      route.request().method() === "POST" ? route.abort() : route.continue(),
    );
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const preview = page.getByLabel(t.evidence);
    await expect(preview).toContainText(t.error);
    await expect(
      page.getByRole("link", {
        name: locale === "uk" ? /Переглянути гонки, що/ : /See races behind/,
      }),
    ).toHaveAttribute(
      "href",
      `/${locale}/explorer/evidence/1/1?year=1950&from=driver&selected=1`,
    );
    await page.unrouteAll();
    await preview.getByRole("button", { name: t.retry }).click();
    await expect(
      preview.getByRole("link", { name: /Synthetic shared-car race/ }),
    ).toBeVisible();
  });
  test(`${locale}: selected comparison distinguishes missing records from zero and restores filters and history`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      `/${locale}/time-machine?kind=constructor&id=1&from=1950&to=1951`,
    );
    const stage = page.getByTestId("comparison-stage");
    await expect(stage).toBeVisible();
    const picker = stage.locator("button").filter({ hasText: "driver-b" });
    await picker.click();
    await expect(page).toHaveURL(/selected=2/);
    const era = stage.getByRole("region", { name: `${m.earlier} 1950` });
    await expect(era.getByRole("definition")).toHaveText(["1", "1", "1"]);
    const missing = stage.getByRole("region", { name: `${m.later} 1951` });
    await expect(missing).toContainText(m.unknownNote);
    await expect(missing.getByRole("definition")).toHaveCount(0);
    await expect(
      stage.getByRole("link", { name: new RegExp(m.share) }),
    ).toHaveAttribute(
      "href",
      `/${locale}/time-machine?kind=constructor&id=1&from=1950&to=1951&selected=2`,
    );
    await stage.locator("button").filter({ hasText: "driver-a" }).click();
    await page.goBack();
    await expect(picker).toHaveAttribute("aria-pressed", "true");
    await stage
      .getByRole("group", { name: m.filter })
      .getByRole("button", { name: new RegExp(m.added) })
      .click();
    await expect(stage.getByRole("status")).toHaveText(m.noRows);
    await stage
      .getByRole("group", { name: m.filter })
      .getByRole("button", { name: new RegExp(m.all) })
      .click();
    await page.goBack();
    await expect(picker).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
  });
  test(`${locale}: both experiences reflow at 200 percent, forced colors and reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({
      reducedMotion: "reduce",
      forcedColors: "active",
    });
    for (const path of [
      "explorer/constructors/1?year=1950",
      "time-machine?kind=constructor&id=1&from=1950&to=1951",
    ]) {
      await page.goto(`/${locale}/${path}`);
      await expect(
        page.locator(
          '[data-testid="network-experience"], [data-testid="comparison-stage"]',
        ),
      ).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
      expect(
        await page
          .locator("main")
          .evaluate(
            (el) =>
              el
                .getAnimations({ subtree: true })
                .filter((a) => a.playState === "running").length,
          ),
      ).toBe(0);
    }
  });
  test(`${locale}: no-data and unloaded selection remain explicit`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1951`);
    await expect(
      page.getByRole("heading", { name: t.emptyTitle }),
    ).toBeVisible();
    await expect(page.getByTestId("network-experience")).toHaveCount(0);
    await page.goto(`/${locale}/explorer/drivers/1?year=1950&selected=999`);
    await expect(page.getByTestId("network-experience")).toContainText(
      t.invalidSelection,
    );
  });
  test(`${locale}: no-JavaScript users retain canonical association links and the full comparison`, async ({
    browser,
    isMobile,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: isMobile ? 375 : 1440, height: isMobile ? 812 : 1000 },
    });
    const page = await context.newPage();
    await page.goto(
      `http://127.0.0.1:3340/${locale}/explorer/constructors/1?year=1950`,
    );
    await page
      .getByRole("link", {
        name: /text view without JavaScript|текстовий вигляд без JavaScript/,
      })
      .click();
    const link = page.getByRole("link", { name: "driver-b", exact: true });
    await expect(link).toHaveAttribute(
      "href",
      new RegExp(`/${locale}/explorer/text\\?.*selected=2`),
    );
    await link.click();
    await expect(
      page.getByRole("region").getByRole("heading", { level: 2 }),
    ).toContainText("driver-b");
    await page.goto(
      `http://127.0.0.1:3340/${locale}/time-machine?kind=driver&id=1&from=1950&to=1951`,
    );
    await page
      .getByRole("link", {
        name: /text view without JavaScript|текстовий вигляд без JavaScript/,
      })
      .click();
    await expect(page.getByRole("table")).toContainText("alpha");
    await expect(page.getByRole('link',{name:'CC BY 4.0',exact:true})).toHaveAttribute('href','https://creativecommons.org/licenses/by/4.0/');
    await expect(
      page.getByRole("link", { name: /Race evidence|Результати гонок/ }),
    ).toHaveAttribute(
      "href",
      new RegExp(
        `/${locale}/explorer/text\\?.*experience=evidence.*driver=1.*constructor=1.*year=1950`,
      ),
    );
    await context.close();
  });
}

for (const locale of ["uk", "en"] as const) {
  test(`${locale}: Explorer outage provides a localized retry instead of invented connections`, async ({
    page,
  }) => {
    await page.goto(
      `http://127.0.0.1:3341/${locale}/explorer/drivers/1?year=1950`,
    );
    await expect(
      page.getByRole("button", {
        name: locale === "uk" ? "Спробувати ще раз" : "Try again",
      }),
    ).toBeVisible();
    await expect(page.getByTestId("network-experience")).toHaveCount(0);
  });
}
