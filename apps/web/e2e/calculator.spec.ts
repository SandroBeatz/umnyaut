import { expect, type Page, test } from "@playwright/test";

const ROOM = "/osnova/ploshchad-komnaty/";
const WALLS = "/osnova/ploshchad-sten/";
const WALLPAPER = "/steny/oboi/";
const PAINT = "/steny/kraska/";
const PLINTH = "/pol/plintus/";
const LINOLEUM = "/pol/linoleum/";
const ADHESIVE = "/plitka/klej/";
const GROUT = "/plitka/zatirka/";
/** Visible area of Safari on a 390 × 844 iPhone (design spec §12). */
const FIRST_SCREEN = 660;

const result = (page: Page) => page.locator("[data-result-value]").first();
const s = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

async function type(page: Page, label: string, value: string) {
  const field = page.getByRole("textbox", { name: label });
  await field.fill(value);
  await field.blur();
}

test("the result number is on the first phone screen of every tool", async ({ page }) => {
  for (const path of [ROOM, WALLS, WALLPAPER, PAINT, PLINTH, LINOLEUM, ADHESIVE, GROUT]) {
    await page.goto(path);
    const box = await result(page).boundingBox();
    expect(box, path).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0), path).toBeLessThanOrEqual(FIRST_SCREEN);
  }
});

test("room area writes “My room”, wall area picks it up", async ({ page }) => {
  await page.goto(ROOM);
  await expect(page.getByText("Это пример. Введите свои размеры")).toBeVisible();
  await type(page, "Длина комнаты", "5");
  await type(page, "Ширина комнаты", "4");
  await expect(result(page)).toHaveText("20");
  await expect(page.getByText("Это пример. Введите свои размеры")).toBeHidden();

  await page
    .getByRole("link", { name: /Площадь стен/ })
    .first()
    .click();
  await expect(page).toHaveURL(WALLS);
  await expect(page.getByRole("textbox", { name: "Длина комнаты" })).toHaveValue("5");
  await expect(page.getByRole("textbox", { name: "Ширина комнаты" })).toHaveValue("4");
  await expect(page.getByText(/Моя комната: 5\s×\s4\sм/)).toBeVisible();
  // 2 × (5 + 4) × 2,7 = 48,6 − door 1,6 − window 1,68 = 45,32
  await expect(result(page)).toHaveText("45,32");

  await type(page, "Высота потолка", "3");
  await page.goto(ROOM);
  await expect(page.getByText(/Моя комната: 5\s×\s4\s×\s3\sм/)).toBeVisible();
});

test("a ?s= link reproduces the result and «Отправить» builds one", async ({ page, context }) => {
  const openings = [
    { type: "door", widthMm: 900, heightMm: 2050, count: 1 },
    { type: "window", widthMm: 1500, heightMm: 1500, count: 2 },
  ];
  await page.goto(`${WALLS}?s=${s({ lengthMm: 5000, widthMm: 4000, openings })}`);
  await expect(result(page)).toHaveText("42,26");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/osnova\/ploshchad-sten\/$/);

  await type(page, "Высота потолка", "3");
  await expect(result(page)).toHaveText("47,66");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText("Ссылка скопирована")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("?s=");

  const fresh = await context.browser()?.newContext({ viewport: { width: 390, height: 844 } });
  const other = await fresh?.newPage();
  if (!other) throw new Error("no second page");
  await other.goto(link);
  await expect(result(other)).toHaveText("47,66");
  await fresh?.close();
});

test("an L-shaped room shows the cut-out fields and subtracts the corner", async ({ page }) => {
  await page.goto(ROOM);
  await type(page, "Длина комнаты", "6");
  await type(page, "Ширина комнаты", "4");
  await expect(page.getByRole("textbox", { name: "Длина выреза" })).toHaveCount(0);
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await page.getByRole("radio", { name: "Г-образная" }).click();
  await type(page, "Длина выреза", "2");
  await type(page, "Ширина выреза", "1,5");
  await expect(result(page)).toHaveText("21");
  await page.getByRole("button", { name: "Свернуть параметры" }).click();
  await expect(page.getByRole("button", { name: /Ещё параметры · 3/ })).toBeVisible();
});

test("an invalid field keeps the last result and says so", async ({ page }) => {
  await page.goto(WALLS);
  await type(page, "Длина комнаты", "500");
  await expect(page.getByText("От 0,3 до 100 м")).toBeVisible();
  await expect(page.getByText("По прошлым значениям")).toBeVisible();
  await expect(result(page)).toHaveText("44,78");
});

test("the sticky bar shows the result once the panel scrolls away", async ({ page }) => {
  await page.goto(WALLS);
  const bar = page.getByRole("link", { name: /К результату/ });
  await expect(bar).toBeHidden();
  await page.getByRole("heading", { name: "Вопросы и ответы" }).scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  await expect(bar).toContainText("44,78");
  await bar.click();
  await expect(page.locator("#result")).toBeInViewport();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the server HTML already has the numbers", async ({ page }) => {
    await page.goto(WALLS);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(result(page)).toHaveText("44,78");
  });
});

test("wallpaper: rolls by strips, roll preset and pattern repeat change the count", async ({ page }) => {
  await page.goto(WALLPAPER);
  // Mockup room: 32 strips of 2,8 m, 3 per 10,05 m roll → 11 rolls; paste 44,78 / 30 → 2 packs.
  await expect(result(page)).toHaveText("11");
  await expect(page.getByText("2 пачки")).toBeVisible();

  await page.getByText("1,06 × 10 м").click();
  await expect(result(page)).toHaveText("6");

  await page.getByText("0,53 × 10 м").click();
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await type(page, "Раппорт", "64");
  // Each strip takes 3,2 m of the roll after the worst pattern start; the pieces need a 12th roll.
  await expect(result(page)).toHaveText("12");
});

test("paint: a can set with sizes, ceiling switch, primer canister", async ({ page }) => {
  await page.goto(PAINT);
  // Walls 44,78 m² × 2 / 10 = 8,956 l → one 9 l can; primer 6,7 l → one 10 l canister.
  await expect(result(page)).toHaveText("1");
  await expect(page.getByText(/1\s×\s9\sл · останется/)).toBeVisible();
  await expect(page.getByText(/^1\sканистра$/)).toBeVisible();
  await expect(page.getByText(/^по 10\sл$/)).toBeVisible();

  await page.getByRole("button", { name: "Что красим" }).click();
  await page.getByRole("radio", { name: "Стены и потолок" }).click();
  // + ceiling 19,78 → 12,912 l → 9 + 2,7 + 2 × 0,9
  await expect(result(page)).toHaveText("4");
  await expect(page.getByText(/1\s×\s9\sл \+ 1\s×\s2,7\sл \+ 2\s×\s0,9\sл/)).toBeVisible();
});

test("room list: wallpaper on the walls and paint on the ceiling share one primer canister", async ({ page }) => {
  await page.goto(WALLPAPER);
  await expect(result(page)).toHaveText("11");
  await page.getByRole("button", { name: "В список" }).click();
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
  const list = page.locator("[data-room-list]");
  await expect(list.getByRole("heading", { name: "Список для комнаты" })).toBeVisible();

  await list.getByRole("link", { name: /Краска/ }).click();
  await expect(page).toHaveURL(PAINT);
  await page.getByRole("button", { name: "Что красим" }).click();
  await page.getByRole("radio", { name: "Потолок", exact: true }).click();
  await page.getByRole("button", { name: "В список" }).click();

  // Walls 44,78 × 0,15 + ceiling 19,78 × 0,15 = 9,68 л → one canister for both works.
  const rows = list.locator("li", { has: page.locator("[data-list-quantity]") });
  await expect(rows).toHaveCount(4);
  await expect(rows.filter({ hasText: "Грунтовка" }).locator("[data-list-quantity]")).toHaveText(/^1\sканистра$/);
  await expect(rows.filter({ hasText: "Обои" }).first().locator("[data-list-quantity]")).toHaveText(/^11\sрулонов$/);

  // The list follows “My room”: a longer room needs more wallpaper.
  await type(page, "Длина комнаты", "6");
  await expect(rows.filter({ hasText: "Обои" }).first().locator("[data-list-quantity]")).not.toHaveText(/^11\s/);

  await list.getByRole("button", { name: "Убрать «Обои» из списка" }).click();
  await expect(rows.filter({ hasText: "Обои" })).toHaveCount(0);
});

test("plinth: planks and fittings, an L-shaped room adds corners", async ({ page }) => {
  await page.goto(PLINTH);
  // 17,8 − 0,8 = 17 м → 7 планок по 2,5 м.
  await expect(result(page)).toHaveText("7");
  await expect(page.getByText(/^4\sштуки$/)).toBeVisible();

  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await page.getByRole("radio", { name: "Г-образная" }).click();
  await expect(page.locator("#result").getByText("Наружный угол")).toBeVisible();
});

test("tile adhesive and grout follow the tile size", async ({ page }) => {
  await page.goto(ADHESIVE);
  // 19,78 м² × 4,2 кг/м² (шпатель 10 мм) = 83,1 кг → 4 мешка по 25 кг.
  await expect(result(page)).toHaveText("4");
  await page.getByRole("radio", { name: "10 × 10" }).click();
  // × 2,0 кг/м² = 39,6 кг → 2 мешка.
  await expect(result(page)).toHaveText("2");

  await page.goto(GROUT);
  // 0,256 кг/м² × 19,78 × 1,1 = 5,57 кг → 3 упаковки по 2 кг.
  await expect(result(page)).toHaveText("3");
});

test("linoleum: the best width and the cut length, a pinned width", async ({ page }) => {
  await page.goto(LINOLEUM);
  // 4,6 × 4,3: no roll covers it; 2,5 м across, 2 × 4,3 = 8,6 м, 21,5 м².
  await expect(result(page)).toHaveText("8,6");
  await expect(page.getByText(/ширина 2,5\sм · 21,5\sм²/)).toBeVisible();

  await page.getByRole("button", { name: "Ширина рулона" }).click();
  await page.getByRole("radio", { name: "4 м" }).click();
  await expect(page.getByText(/ширина 4\sм · 34,4\sм²/)).toBeVisible();
});
