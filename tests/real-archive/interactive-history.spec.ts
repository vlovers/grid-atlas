import { test, expect } from "@playwright/test";
import { explorerCopy } from "../../apps/web/src/components/explorer/copy";
import { machineCopy } from "../../apps/web/src/app/[locale]/time-machine/copy";
const api = "http://127.0.0.1:3350/api";
for (const locale of ["uk", "en"] as const) {
  const e = explorerCopy[locale];
  const m = machineCopy[locale];
  test(`${locale}: real home-to-network-to-race-to-comparison journey retains exact records and a share URL`, async ({
    page,
    request,
    browser,
  }) => {
    const errors: string[] = [];
    const remote: string[] = [];
    page.on("pageerror", (v) => errors.push(v.message));
    page.on("request", (r) => {
      if (new URL(r.url()).hostname !== "127.0.0.1") remote.push(r.url());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    const home = page.getByTestId("atlas-home");
    await expect(home).toBeVisible();
    const entry = home.locator('a[href*="/explorer/drivers/"]').last();
    const href = (await entry.getAttribute("href"))!;
    await entry.click();
    const network = page.getByTestId("network-experience");
    await expect(network).toBeVisible();
    await network.locator("[data-network-node]").first().press("Enter");
    const inspector = page.getByRole("complementary");
    await expect(inspector).toBeFocused();
    const evidence = inspector.getByRole("link", {
      name: locale === "uk" ? /Переглянути гонки, що/ : /See races behind/,
    });
    const evidenceUrl = new URL(
      (await evidence.getAttribute("href"))!,
      "http://127.0.0.1:3351",
    );
    const parts = evidenceUrl.pathname.split("/");
    const driver = parts.at(-2)!;
    const constructor = parts.at(-1)!;
    const year = evidenceUrl.searchParams.get("year")!;
    const records = (
      await (
        await request.get(
          `${api}/explorer/drivers/${driver}/constructors/${constructor}/races?year=${year}`,
        )
      ).json()
    ).data;
    await evidence.click();
    const race = page.getByRole("table").getByRole("link").first();
    await expect(race).toHaveAttribute(
      "href",
      `/${locale}/races/${records.races[0].race_id}`,
    );
    await race.click();
    await expect(
      page.getByTestId("story-header").getByRole("heading", { level: 1 }),
    ).toHaveText(records.races[0].official_name);
    await page.goBack();
    await page
      .getByRole("navigation", {
        name:
          locale === "uk" ? "Продовжити порівняння" : "Continue the comparison",
      })
      .getByRole("link")
      .click();
    const stage = page.getByTestId("comparison-stage");
    await expect(stage).toBeVisible();
    const selectable = stage
      .locator("button")
      .filter({ has: page.locator("strong") })
      .first();
    await selectable.press("Enter");
    const share = stage.getByRole("link", { name: new RegExp(m.share) });
    const shared = (await share.getAttribute("href"))!;
    expect(shared).toContain("selected=");
    const other = await browser.newPage();
    await other.goto(`http://127.0.0.1:3351${shared}`);
    await expect(
      other
        .getByTestId("comparison-stage")
        .locator('button[aria-pressed="true"]')
        .filter({ has: other.locator("strong") }),
    ).toHaveText((await selectable.textContent()) ?? "");
    await other.close();
    expect(href).toContain("/explorer/drivers/");
    expect(errors).toEqual([]);
    expect(remote).toEqual([]);
  });
  test(`${locale}: dense real network exposes every capped association, selection window and remaining page`, async ({
    page,
    request,
    isMobile,
  }) => {
    const year = process.env.SMOKE_BUSY_YEAR!;
    const id = process.env.SMOKE_BUSY_CONSTRUCTOR!;
    const graph = (
      await (
        await request.get(
          `${api}/explorer/constructors/${id}/connections?year=${year}`,
        )
      ).json()
    ).data;
    await page.goto(`/${locale}/explorer/constructors/${id}?year=${year}`);
    const network = page.getByTestId("network-experience");
    await expect(network).toBeVisible();
    const last = network.locator("#network-list li").last().getByRole("button");
    await last.click();
    const finalNode = graph.nodes.find(
      (n: { key: string }) => n.key === graph.edges.at(-1).to,
    );
    await expect(
      network.locator('[data-network-node][aria-current="true"]'),
    ).toHaveAttribute(
      "aria-label",
      new RegExp(finalNode.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    await expect(
      network.getByRole("complementary").getByRole("heading", { level: 2 }),
    ).toContainText(finalNode.name);
    for (const width of [isMobile ? 1440 : 375, isMobile ? 375 : 1440]) {
      await page.setViewportSize({ width, height: width < 600 ? 812 : 1000 });
      await expect(network.locator("svg")).toHaveAttribute(
        "viewBox",
        width < 600 ? /^260 210 600 / : "0 0 1120 720",
      );
      await expect(
        network.locator('[data-network-node][aria-current="true"]'),
      ).toHaveCount(1);
    }
    if (isMobile) {
      const viewport = network
        .getByRole("region", {
          name: "Прокручувана карта зв’язків",
          exact: true,
        })
        .or(
          network.getByRole("region", {
            name: "Scrollable connection map",
            exact: true,
          }),
        );
      const box = (await viewport.boundingBox())!;
      for (const node of await network
        .locator("[data-network-node] rect")
        .all()) {
        const b = (await node.boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(box.x);
        expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 1);
      }
    }
    await expect(
      page.getByRole("link", {
        name: locale === "uk" ? /Переглянути решту/ : /Browse remaining/,
      }),
    ).toBeVisible();
    const text = await request.get(
      `http://127.0.0.1:3351/${locale}/explorer/text?experience=network&kind=constructor&id=${id}&year=${year}&offset=25`,
    );
    expect(text.status()).toBe(200);
    expect(await text.text()).toContain(
      `26–${process.env.SMOKE_BUSY_DEGREE} / ${process.env.SMOKE_BUSY_DEGREE}`,
    );
    expect(graph.truncated).toBe(true);
    await network.getByRole("link", { name: new RegExp(e.all) }).click();
    await expect(page.getByRole("status")).toContainText(
      `/ ${process.env.SMOKE_BUSY_DEGREE}`,
    );
    await page.goto(
      `/${locale}/time-machine?kind=constructor&id=${id}&from=${year}&to=${Number(year) + 1}`,
    );
    const stage = page.getByTestId("comparison-stage");
    const choices = stage
      .locator("button")
      .filter({ has: page.locator("strong") });
    await expect(choices).toHaveCount(6);
    await stage.getByRole("button", { name: new RegExp(m.next) }).click();
    await expect(page).toHaveURL(/selected=[0-9]+/);
    await expect(choices).toHaveCount(6);
    const nextId = new URL(page.url()).searchParams.get("selected");
    await stage.getByRole("button", { name: new RegExp(m.previous) }).click();
    expect(new URL(page.url()).searchParams.get("selected")).not.toBe(nextId);
  });
  test(`${locale}: early/middle/modern comparisons agree with the API in both identity directions`, async ({
    page,
    request,
  }) => {
    const get = async (path: string) =>
      (await (await request.get(api + path)).json()).data;
    for (const year of [1950, 1988, 2010]) {
      const race = (await get(`/seasons/${year}/races?limit=1`))[0];
      const result = (await get(`/races/${race.id}/results?limit=100`)).find(
        (r: { driver_id: string; constructor_id: string }) =>
          r.driver_id && r.constructor_id,
      );
      for (const kind of ["driver", "constructor"] as const) {
        const id = kind === "driver" ? result.driver_id : result.constructor_id;
        const route = kind === "driver" ? "drivers" : "constructors";
        const data = await get(
          `/explorer/${route}/${id}/compare?fromYear=${year}&toYear=${year + 1}`,
        );
        const inverse = await get(
          `/explorer/${route}/${id}/compare?fromYear=${year + 1}&toYear=${year}`,
        );
        expect(
          inverse.added.map((r: { entity_id: string }) => r.entity_id),
        ).toEqual(data.removed.map((r: { entity_id: string }) => r.entity_id));
        await page.goto(
          `/${locale}/time-machine?kind=${kind}&id=${id}&from=${year}&to=${year + 1}`,
        );
        const stage = page.getByTestId("comparison-stage");
        await expect(stage).toBeVisible();
        const row = [...data.added, ...data.removed, ...data.unchanged][0];
        if (row)
          for (const [side, y, label] of [
            ["from", year, m.earlier],
            ["to", year + 1, m.later],
          ] as const) {
            const panel = stage.getByRole("region", { name: `${label} ${y}` });
            if (row[side])
              await expect(panel.getByRole("definition")).toHaveText([
                String(row[side].races),
                String(row[side].result_entries),
                String(row[side].winning_races),
              ]);
            else {
              await expect(panel).toContainText(m.unknownNote);
              await expect(panel.getByRole("definition")).toHaveCount(0);
            }
          }
      }
    }
  });
  test(`${locale}: repeated early result rows remain separate from races in network and comparison`, async ({
    page,
    request,
  }) => {
    const drivers = (
      await (
        await request.get(`${api}/drivers?q=alberto-ascari&limit=5`)
      ).json()
    ).data;
    const driver = drivers.find(
      (d: { external_id: string }) => d.external_id === "alberto-ascari",
    );
    const graph = (
      await (
        await request.get(
          `${api}/explorer/drivers/${driver.id}/connections?year=1950`,
        )
      ).json()
    ).data;
    const repeated = graph.edges.find(
      (r: { result_entries: number; races: number }) =>
        r.result_entries > r.races,
    );
    expect(repeated).toBeTruthy();
    const node = graph.nodes.find(
      (n: { key: string }) => n.key === repeated.to,
    );
    await page.goto(
      `/${locale}/explorer/drivers/${driver.id}?year=1950&selected=${node.entity_id}`,
    );
    await expect(
      page.getByRole("complementary").getByRole("definition"),
    ).toHaveText([
      String(repeated.races),
      String(repeated.result_entries),
      String(repeated.winning_races),
    ]);
    await page.goto(
      `/${locale}/time-machine?kind=driver&id=${driver.id}&from=1950&to=1951&selected=${node.entity_id}`,
    );
    const panel = page
      .getByTestId("comparison-stage")
      .getByRole("region", { name: `${m.earlier} 1950` });
    await expect(panel.getByRole("definition")).toHaveText([
      String(repeated.races),
      String(repeated.result_entries),
      String(repeated.winning_races),
    ]);
  });
}
