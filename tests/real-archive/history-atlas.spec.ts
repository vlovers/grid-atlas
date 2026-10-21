import { test, expect } from "@playwright/test";
import { historyAtlasCopy } from "../../apps/web/src/components/history-atlas/copy";
import {
  parseExplorerGraph,
  parseConstructorExplorerGraph,
} from "../../apps/web/src/lib/explorer-contract";
const api = "http://127.0.0.1:3350/api";
for (const locale of ["en", "uk"] as const) {
  const t = historyAtlasCopy[locale];
  test(`${locale}: pinned Senna Atlas journey pivots, restores context and opens genuine race evidence`, async ({
    page,
    request,
  }) => {
    const identities = (
      await (await request.get(`${api}/drivers?q=ayrton-senna&limit=10`)).json()
    ).data;
    const senna = identities.find(
      (d: { external_id: string }) => d.external_id === "ayrton-senna",
    );
    expect(senna).toBeTruthy();
    const graph = parseExplorerGraph(
      await (
        await request.get(
          `${api}/explorer/drivers/${senna.id}/connections?year=1988`,
        )
      ).json(),
      senna.id,
      1988,
    );
    const connection = graph.nodes.find((n) => n.key === graph.edges[0].to)!;
    await page.goto(
      `/${locale}/atlas?kind=driver&id=${senna.id}&year=1988&selected=${connection.entity_id}`,
    );
    const atlas = page.getByTestId("history-atlas");
    const inspector = atlas.getByRole("complementary");
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      connection.name,
    );
    await expect(inspector.getByRole("definition")).toHaveText([
      String(graph.edges[0].races),
      String(graph.edges[0].result_entries),
      String(graph.edges[0].winning_races),
    ]);
    const evidence = (await inspector
      .getByRole("link", { name: new RegExp(t.evidence) })
      .getAttribute("href"))!;
    await inspector.getByRole("link", { name: new RegExp(t.pivot) }).click();
    await expect(atlas.getByRole("heading", { level: 2 })).toHaveText(
      `${connection.name} · 1988`,
    );
    await page
      .getByRole("navigation", { name: t.trail })
      .getByRole("link", { name: /Ayrton Senna/ })
      .click();
    await expect(inspector.getByRole("heading", { level: 3 })).toHaveText(
      connection.name,
    );
    await expect(page).toHaveURL(
      new RegExp(
        `kind=driver.*id=${senna.id}.*year=1988.*selected=${connection.entity_id}`,
      ),
    );
    await page.goto(evidence);
    const race = page.getByRole("table").getByRole("link").first();
    const href = (await race.getAttribute("href"))!;
    expect(href).toMatch(new RegExp(`^/${locale}/races/[1-9][0-9]*$`));
    await race.click();
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      /Loading|Завантаження/,
    );
  });
  test(`${locale}: dense pinned constructor Atlas bounds rendering and survives both breakpoint transitions`, async ({
    page,
    request,
    isMobile,
  }) => {
    const id = process.env.SMOKE_BUSY_CONSTRUCTOR!;
    const year = Number(process.env.SMOKE_BUSY_YEAR!);
    const graph = parseConstructorExplorerGraph(
      await (
        await request.get(
          `${api}/explorer/constructors/${id}/connections?year=${year}`,
        )
      ).json(),
      id,
      year,
    );
    expect(graph.edges.length).toBe(25);
    expect(graph.truncated).toBe(true);
    await page.goto(`/${locale}/atlas?kind=constructor&id=${id}&year=${year}`);
    const atlas = page.getByTestId("history-atlas");
    const list = atlas.locator("#atlas-connections");
    await expect(list.getByRole("listitem")).toHaveCount(25);
    await list.getByRole("button").last().click();
    const last = graph.nodes.find((n) => n.key === graph.edges.at(-1)!.to)!;
    const canvas = page.getByTestId("atlas-canvas");
    await expect(canvas.locator(`[data-id="${last.key}"]`)).toBeVisible();
    expect(
      await canvas.locator(".react-flow__node").count(),
    ).toBeLessThanOrEqual(isMobile ? 3 : 9);
    await expect(atlas).toContainText(t.truncated);
    await page.setViewportSize({ width: isMobile ? 1440 : 375, height: 1000 });
    await expect(canvas.locator(`[data-id="${last.key}"]`)).toBeVisible();
    await page.setViewportSize({ width: isMobile ? 393 : 1440, height: 1000 });
    await expect(canvas.locator(`[data-id="${last.key}"]`)).toBeVisible();
    await expect(
      atlas.getByRole("complementary").getByRole("heading", { level: 3 }),
    ).toHaveText(last.name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
  test(`${locale}: early repeated result entries remain distinct from races in the Atlas`, async ({
    page,
    request,
  }) => {
    const drivers = (
      await (
        await request.get(`${api}/drivers?q=alberto-ascari&limit=10`)
      ).json()
    ).data;
    const ascari = drivers.find(
      (d: { external_id: string }) => d.external_id === "alberto-ascari",
    );
    const graph = parseExplorerGraph(
      await (
        await request.get(
          `${api}/explorer/drivers/${ascari.id}/connections?year=1950`,
        )
      ).json(),
      ascari.id,
      1950,
    );
    const edge = graph.edges.find((e) => e.result_entries > e.races)!;
    expect(edge).toBeTruthy();
    const other = graph.nodes.find((n) => n.key === edge.to)!;
    await page.goto(
      `/${locale}/atlas?kind=driver&id=${ascari.id}&year=1950&selected=${other.entity_id}`,
    );
    const inspector = page.getByRole("complementary");
    await expect(inspector.getByRole("definition")).toHaveText([
      String(edge.races),
      String(edge.result_entries),
      String(edge.winning_races),
    ]);
    await page.getByText(t.limits, { exact: true }).first().click();
    await expect(page.getByTestId("history-atlas")).toContainText(
      t.limitations,
    );
  });
}
