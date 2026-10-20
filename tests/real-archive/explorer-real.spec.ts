import { test, expect } from "@playwright/test";

// Unlike tests/browser, this suite uses a fresh genuine F1DB import.
// Canonical IDs and year are discovered by SQL in CI, never hardcoded.
const year = process.env.SMOKE_YEAR;
const driver = process.env.SMOKE_DRIVER_ID;
const constructorId = process.env.SMOKE_CONSTRUCTOR_ID;
if (!year || !driver || !constructorId) {
  throw new Error(
    "SMOKE_YEAR, SMOKE_DRIVER_ID and SMOKE_CONSTRUCTOR_ID are required",
  );
}

for (const locale of ["uk", "en"] as const) {
  test(`${locale}: real no-data year is honest and does not invent edges`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/explorer/drivers/${driver}?year=2200`);
    await expect(
      page.getByText(
        locale === "uk"
          ? "У цьому сезоні немає записаних результатів для пілота."
          : "No recorded results for this driver in this season.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name:
          locale === "uk"
            ? "Прокручувана карта зв’язків"
            : "Scrollable connection map",
      }),
    ).toHaveCount(0);
  });

  test(`${locale}: real imported graph viewport supports keyboard focus and mobile pan`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(
      `/${locale}/explorer/drivers/${driver}?year=${year}&selected=${constructorId}`,
    );
    const viewport = page.getByRole("region", {
      name:
        locale === "uk"
          ? "Прокручувана карта зв’язків"
          : "Scrollable connection map",
    });
    await expect(viewport).toBeVisible();
    await viewport.focus();
    await expect(viewport).toBeFocused();
    if (isMobile) {
      const geometry = await viewport.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));
      expect(geometry.scrollWidth).toBeLessThanOrEqual(
        geometry.clientWidth + 1,
      );
      const transform = page.getByTestId("network-transform");
      const before = await transform.getAttribute("transform");
      await viewport.press("ArrowLeft");
      await expect(transform).not.toHaveAttribute("transform", before!);
      await viewport.press("Home");
      await expect(transform).toHaveAttribute("transform", before!);
    }
    const inspector = page.getByRole("complementary", {
      name: locale === "uk" ? "Деталі зв’язку" : "Connection details",
    });
    await expect(inspector).toContainText(
      locale === "uk"
        ? "не доказ офіційних стартів"
        : "not evidence of official starts",
    );
  });

  test(`${locale}: real archive graph -> evidence -> back -> reciprocal graph`, async ({
    page,
  }) => {
    const driverUrl = `/${locale}/explorer/drivers/${driver}?year=${year}&selected=${constructorId}`;
    const constructorUrl = `/${locale}/explorer/constructors/${constructorId}?year=${year}&selected=${driver}`;
    await page.goto(driverUrl);
    const graph = page.getByRole("region", {
      name:
        locale === "uk"
          ? "Прокручувана карта зв’язків"
          : "Scrollable connection map",
    });
    await expect(graph).toBeVisible();
    const inspector = page.getByRole("complementary", {
      name: locale === "uk" ? "Деталі зв’язку" : "Connection details",
    });
    await expect(inspector).toBeVisible();
    await expect(inspector.getByRole("heading", { level: 2 })).toBeVisible();

    const evidence = inspector.getByRole("link", {
      name:
        locale === "uk"
          ? /Переглянути гонки/
          : /See races behind this connection/,
    });
    await expect(evidence).toHaveAttribute(
      "href",
      `/${locale}/explorer/evidence/${driver}/${constructorId}?year=${year}&from=driver&selected=${constructorId}`,
    );
    await evidence.click();
    await expect(page).toHaveURL(
      new RegExp(`/${locale}/explorer/evidence/${driver}/${constructorId}\\?`),
    );
    await expect(page.getByRole("table")).toBeVisible();
    expect(await page.getByRole("row").count()).toBeGreaterThan(1);

    const back = page.getByRole("link", {
      name: locale === "uk" ? /Повернутися до графа/ : /Back to graph/,
    });
    await expect(back).toHaveAttribute("href", driverUrl);
    await back.click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/explorer/drivers/${driver}\\?year=${year}&selected=${constructorId}$`,
      ),
    );

    const pivot = page
      .getByRole("complementary", {
        name: locale === "uk" ? "Деталі зв’язку" : "Connection details",
      })
      .getByRole("link", {
        name:
          locale === "uk"
            ? /Дослідити зв’язки цього конструктора/
            : /Explore this constructor’s connections/,
      });
    await expect(pivot).toHaveAttribute(
      "href",
      `${constructorUrl}#explorer-inspector`,
    );
    await pivot.click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale}/explorer/constructors/${constructorId}\\?year=${year}&selected=${driver}#explorer-inspector$`,
      ),
    );
    await expect(
      page
        .getByRole("complementary", {
          name: locale === "uk" ? "Деталі зв’язку" : "Connection details",
        })
        .getByRole("heading", { level: 2 }),
    ).toBeVisible();
  });
}
