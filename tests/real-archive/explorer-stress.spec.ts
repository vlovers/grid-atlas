import { expect, test } from "@playwright/test";

// Discovered by SQL from the pinned, real archive at CI runtime.
const busyYear = process.env.SMOKE_BUSY_YEAR;
const busyConstructor = process.env.SMOKE_BUSY_CONSTRUCTOR;
const busyDegree = Number(process.env.SMOKE_BUSY_DEGREE);
const longYear = process.env.SMOKE_LONG_YEAR;
const longDriver = process.env.SMOKE_LONG_DRIVER;
const longConstructor = process.env.SMOKE_LONG_CONSTRUCTOR;
if (
  !busyYear ||
  !busyConstructor ||
  !Number.isSafeInteger(busyDegree) ||
  busyDegree < 1 ||
  !longYear ||
  !longDriver ||
  !longConstructor
) {
  throw new Error(
    "Real-archive stress selectors must be populated from PostgreSQL",
  );
}
const MAX_API_EDGES = 25;
const MAX_SVG_EDGES = 8;

for (const locale of ["uk", "en"] as const) {
  test(`${locale}: densest real constructor graph keeps list, SVG and truncation in sync`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(
      `/${locale}/explorer/constructors/${busyConstructor}?year=${busyYear}`,
    );
    const panel = page.getByRole("region", {
      name:
        locale === "uk"
          ? "Прокручувана карта зв’язків"
          : "Scrollable connection map",
    });
    await expect(panel).toBeVisible();
    const graphSection = page.getByRole("region", {
      name: locale === "uk" ? "Карта зв’язків" : "Connection map",
      exact: true,
    });
    const expectedEdges = Math.min(busyDegree, MAX_API_EDGES);
    const fullList = graphSection.locator("ul li");
    await expect(fullList).toHaveCount(expectedEdges);
    await expect(panel.locator("svg a")).toHaveCount(
      Math.min(expectedEdges, isMobile ? 4 : MAX_SVG_EDGES),
    );
    await expect(
      graphSection.getByRole("button", { pressed: true }),
    ).toHaveCount(1);

    if (expectedEdges > MAX_SVG_EDGES) {
      await expect(graphSection).toContainText(
        locale === "uk"
          ? "Мапа показує вікно зрізу API."
          : "The map shows a window of the API slice.",
      );
      const last = fullList.last().getByRole("button");
      const name = await last.textContent();
      await last.click();
      await expect(page).toHaveURL(/selected=[0-9]+/);
      await expect(
        page
          .getByRole("complementary", {
            name: locale === "uk" ? "Деталі зв’язку" : "Connection details",
          })
          .getByRole("heading", { level: 2 }),
      ).toContainText(name?.trim() ?? "");
    }
    if (busyDegree > MAX_API_EDGES) {
      await expect(
        page.getByRole("status").filter({
          hasText:
            locale === "uk" ? "Показано лише перших" : "Showing only the first",
        }),
      ).toContainText(
        locale === "uk" ? "Показано лише перших" : "Showing only the first",
      );
    }
    if (isMobile) {
      const width = await panel.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));
      expect(width.scrollWidth).toBeLessThanOrEqual(width.clientWidth + 1);
      await expect(panel.locator("[data-network-node]")).toHaveCount(
        expectedEdges > MAX_SVG_EDGES
          ? ((expectedEdges - 1) % 4) + 1
          : Math.min(4, expectedEdges),
      );
    }
  });

  test(`${locale}: every real high-degree association has a bounded evidence path`, async ({
    page,
  }) => {
    test.skip(
      busyDegree <= MAX_API_EDGES,
      "Pinned dataset has no second page for this sample",
    );
    await page.goto(
      `/${locale}/explorer/constructors/${busyConstructor}?year=${busyYear}`,
    );
    const more = page.getByRole("link", {
      name:
        locale === "uk"
          ? /Переглянути решту зв’язків/
          : /Browse remaining connections/,
    });
    await expect(more).toHaveAttribute(
      "href",
      `/${locale}/explorer/connections/constructors/${busyConstructor}?year=${busyYear}&offset=25`,
    );
    await more.click();
    await expect(page).toHaveURL(/offset=25/);
    await expect(page.getByRole("status")).toContainText(
      `26–${busyDegree} / ${busyDegree}`,
    );
    const rows = page.locator("main ol li");
    await expect(rows).toHaveCount(busyDegree - MAX_API_EDGES);
    const evidence = rows.first().getByRole("link", {
      name: locale === "uk" ? /Переглянути гонки/ : /View race evidence/,
    });
    await evidence.click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: locale === "uk" ? /Повернутися до графа/ : /Back to graph/,
      }),
    ).toBeVisible();
  });

  test(`${locale}: longest imported driver label remains readable outside abbreviated SVG`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/explorer/drivers/${longDriver}?year=${longYear}&selected=${longConstructor}`,
    );
    const heading = page.getByRole("heading", { level: 1 });
    const inspector = page.getByRole("complementary", {
      name: locale === "uk" ? "Деталі зв’язку" : "Connection details",
    });
    await expect(inspector).toBeVisible();
    // Wait for Next.js streaming/loading UI before reading the real name.
    await expect(heading).not.toHaveText(
      /Loading the archive|Завантаження архіву/,
    );
    const fullName = (await heading.textContent())?.trim() ?? "";
    expect(fullName.length).toBeGreaterThan(15);
    await expect(inspector).toContainText(fullName);
    await expect(
      page.getByRole("region", {
        name:
          locale === "uk"
            ? "Прокручувана карта зв’язків"
            : "Scrollable connection map",
      }),
    ).toBeVisible();
  });
}
