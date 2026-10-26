import { test, expect } from "@playwright/test";
import en from "../../apps/web/messages/en.json";
import uk from "../../apps/web/messages/uk.json";

// The API browser server owns synthetic driver-a / alpha fixtures; these are not historical claims.
for (const locale of ["uk", "en"] as const) {
  const t = locale === "uk" ? uk.UI : en.UI;
  test(`${locale}: search, compare recorded associations, and open seasonal graph and race evidence`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/time-machine`);
    const kind = page.getByLabel(
      t.timeMachineFocusType,
    );
    await expect(kind).toContainText(t.driver);
    await page
      .getByLabel(
        locale === "uk"
          ? "Знайти пілота або конструктора"
          : "Find a driver or constructor",
      )
      .fill("driver-a");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/time-machine\\?kind=driver&q=driver-a$`,
      ),
    );

    const match = page.getByRole("link", { name: /driver-a/ });
    await expect(match).toHaveAttribute(
      "href",
      `/${locale}/time-machine?kind=driver&id=1`,
    );
    await match.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/time-machine\\?kind=driver&id=1$`,
      ),
    );

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      locale === "uk" ? "Машина часу" : "Time Machine",
    );
    await expect(
      page.getByRole("heading", { level: 2, name: "driver-a" }),
    ).toBeVisible();
    if ((await page.getByTestId('comparison-details').getAttribute('open')) === null) await page.getByTestId('comparison-details').locator(':scope > summary').click();
    const removed = page.getByRole("region", {
      name:
        t.timeMachineRemoved,
    });
    await expect(removed).toBeVisible();
    await expect(removed.getByText("1950", { exact: true })).toBeVisible();
    await expect(
      removed.locator("dt").getByText(
        locale === "uk" ? "Результати гонок" : "Race results", { exact: true },
      ),
    ).toBeVisible();
    await expect(removed.getByRole("definition")).toHaveText(["1", "1", "1"]);
    await expect(removed.getByRole("link", { name: /1950/ })).toHaveAttribute(
      "href",
      `/${locale}/explorer/constructors/1?year=1950&selected=1`,
    );
    await expect(
      removed.getByRole("link", {
        name: t.timeMachineEvidence,
      }),
    ).toHaveAttribute(
      "href",
      `/${locale}/explorer/evidence/1/1?year=1950&from=driver&selected=1`,
    );

    const compareForm = page
      .locator("form")
      .filter({
        has: page.getByRole("button", {
          name: locale === "uk" ? "Порівняти сезони" : "Compare seasons",
        }),
      });
    await compareForm
      .getByLabel(locale === "uk" ? "Раніший сезон" : "Earlier season")
      .fill("1951");
    await compareForm
      .getByRole("button", {
        name: locale === "uk" ? "Порівняти сезони" : "Compare seasons",
      })
      .click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/time-machine\\?kind=driver&id=1&from=1951&to=1951$`,
      ),
    );
    await expect(page.locator('p[role="alert"]')).toContainText(
      locale === "uk" ? "два різні сезони" : "two different seasons",
    );
    await page.goBack();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/time-machine\\?kind=driver&id=1$`,
      ),
    );
    await expect(
      page.getByRole("heading", { level: 2, name: "driver-a" }),
    ).toBeVisible();
    await expect(
      page.getByLabel(locale === "uk" ? "Раніший сезон" : "Earlier season", {
        exact: true,
      }),
    ).toHaveValue("1950");
    await expect(
      page.getByLabel(locale === "uk" ? "Пізніший сезон" : "Later season", {
        exact: true,
      }),
    ).toHaveValue("1951");

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: testInfo.outputPath(`time-machine-${locale}.png`),
      fullPage: true,
    });

    if ((await page.getByTestId('comparison-details').getAttribute('open')) === null) await page.getByTestId('comparison-details').locator(':scope > summary').click();
    await removed
      .getByRole("link", {
        name: t.timeMachineEvidence,
      })
      .click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/explorer/evidence/1/1\\?year=1950&from=driver&selected=1$`,
      ),
    );
    await expect(
      page.getByRole("link", { name: /Synthetic shared-car race/ }),
    ).toHaveAttribute("href", `/${locale}/races/1`);

    await page.goto(
      `/${locale}/time-machine?kind=driver&id=1&from=1951&to=1950`,
    );
    await expect(page.locator('p[role="alert"]')).toContainText(
      locale === "uk"
        ? "Раніший сезон має передувати пізнішому"
        : "The earlier season must come before the later season",
    );
  });

  test(`${locale}: constructor focus and seasons without result records remain distinct`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/time-machine?kind=constructor&q=alpha&from=1950&to=1951`,
    );
    const match = page.getByRole("link", { name: /alpha/ });
    await expect(match).toHaveAttribute(
      "href",
      `/${locale}/time-machine?kind=constructor&id=1&from=1950&to=1951`,
    );
    await match.click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/time-machine\\?kind=constructor&id=1&from=1950&to=1951$`,
      ),
    );
    await expect(
      page.getByRole("heading", { level: 2, name: "alpha" }),
    ).toBeVisible();
    if ((await page.getByTestId('comparison-details').getAttribute('open')) === null) await page.getByTestId('comparison-details').locator(':scope > summary').click();
    await expect(
      page.getByRole("region", {
        name:
          t.timeMachineRemoved,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name:
          locale === "uk"
            ? /Дослідити зв’язки сезону 1950/
            : /Explore 1950 season connections/,
      }),
    ).toHaveAttribute("href", `/${locale}/explorer/constructors/1?year=1950`);

    await page.goto(
      `/${locale}/time-machine?kind=driver&id=1&from=1951&to=1952`,
    );
    await expect(
      page.getByText(
        t.timeMachineNoAssociations,
      ),
    ).toBeVisible();

    await page.goto(
      `/${locale}/time-machine?kind=driver&id=999999&from=1950&to=1951`,
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: locale === "uk" ? "Сторінку не знайдено" : "Page not found",
      }),
    ).toBeVisible();
  });
}

test("Time Machine responds to reduced motion and keeps controls keyboard operable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/time-machine?kind=driver&id=1&from=1950&to=1951");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
  expect(
    await page
      .getByTestId("comparison-stage")
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("Time Machine shows a localized error state when the API is unavailable", async ({
  page,
}) => {
  await page.goto(
    "http://127.0.0.1:3341/en/time-machine?kind=driver&id=1&from=1950&to=1951",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Time Machine" }),
  ).toBeVisible();
  await expect(page.locator('p[role="alert"]')).toContainText(
    "temporarily unavailable",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

for (const locale of ["uk", "en"] as const) {
  test(`${locale}: unsupported comparison entity kinds do not silently fall back to driver`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/time-machine?kind=team&id=1&from=1950&to=1951`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: locale === "uk" ? "Сторінку не знайдено" : "Page not found",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "driver-a" }),
    ).toHaveCount(0);
  });
}
