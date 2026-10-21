import { expect, test } from "@playwright/test";

const WALLS = "/osnova/ploshchad-sten/";
/** Design spec §11: the banner is a narrow bar, not higher than 96 px on a phone. */
const MAX_HEIGHT = 96;

test("cookie banner: narrow, nothing from Metrika before «Принять», the choice is kept, footer reopens it", async ({
  page,
}) => {
  const metrika: string[] = [];
  page.on("request", (request) => {
    if (/mc\.yandex|yastatic/.test(request.url())) metrika.push(request.url());
  });

  await page.goto(WALLS);
  const banner = page.getByRole("region", { name: "Cookie" });
  await expect(banner).toBeVisible();
  expect((await banner.boundingBox())?.height ?? 0).toBeLessThanOrEqual(MAX_HEIGHT);
  const [accept, decline] = [
    banner.getByRole("button", { name: "Принять" }),
    banner.getByRole("button", { name: "Отклонить" }),
  ];
  expect((await accept.boundingBox())?.width).toBe((await decline.boundingBox())?.width);

  // The sticky result bar stands on the banner, not under it.
  await page.getByRole("heading", { name: "Вопросы и ответы" }).scrollIntoViewIfNeeded();
  const sticky = page.getByRole("link", { name: /К результату/ });
  await expect(sticky).toBeVisible();
  const top = (await banner.boundingBox())?.y ?? 0;
  // Polled: the bar slides in over 200 ms.
  await expect
    .poll(async () => {
      const bar = await sticky.boundingBox();
      return (bar?.y ?? 0) + (bar?.height ?? 0);
    })
    .toBeLessThanOrEqual(top + 1);

  await decline.click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(banner).toBeHidden();

  await page.getByRole("button", { name: "Настройки cookie" }).click();
  await expect(banner).toBeVisible();
  await accept.click();
  await expect(banner).toBeHidden();
  // Metrika runs on the production host only, so a local run must stay silent even after consent.
  expect(metrika).toEqual([]);
});

test("the static HTML has no banner and the structured data", async ({ request }) => {
  const html = await (await request.get(WALLS)).text();
  expect(html).not.toContain("Метрика и cookie");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1] ?? "null"),
  );
  const types = blocks.flat().map((block: { "@type": string }) => block["@type"]);
  expect(types).toEqual(["WebApplication", "BreadcrumbList", "FAQPage"]);
});

test("the own counter gets the events without consent: name, tool, country, source — nothing else (P9.3)", async ({
  page,
}) => {
  const events: Array<Record<string, unknown>> = [];
  // Previews have no database: the counter is answered here.
  await page.route("**/api/e/", async (route) => {
    events.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 204 });
  });
  await page.goto(WALLS);
  await expect(page.getByRole("region", { name: "Cookie" })).toBeVisible();
  await expect.poll(() => events.map((e) => e.event)).toContain("tool_view");
  for (const event of events) {
    expect(Object.keys(event).sort()).toEqual(expect.arrayContaining(["event", "source"]));
    for (const key of Object.keys(event)) expect(["event", "tool", "country", "source"]).toContain(key);
  }
  expect(events.find((e) => e.event === "tool_view")).toMatchObject({ tool: "ploshchad-sten", source: "web" });
});
