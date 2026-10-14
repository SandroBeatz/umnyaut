import { expect, test } from "@playwright/test";

/** The room editor opens by itself on a calculator without rooms (once a visit); not what these tests check. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("umnyaut:room-asked:v1", "1"));
});

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
