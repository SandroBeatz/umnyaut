import { expect, type Page, test } from "@playwright/test";

const ESTIMATE = "/smeta/";
const KEY = "umnyaut:estimate:v1";

/** Two rooms with calcs in the estimate, a bedroom with a draft only (spec «Смета», scenario 4). */
const seed = {
  state: {
    estimate: {
      schemaVersion: 2,
      id: "e2e",
      name: "Ремонт квартиры",
      country: "RU",
      rooms: [
        { id: "r1", name: "Зал", type: "living", lengthMm: 4600, widthMm: 4300, heightMm: 2700, openings: [] },
        { id: "r2", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1700, heightMm: 2500, openings: [] },
        { id: "r3", name: "Спальня", type: "bedroom", lengthMm: 3800, widthMm: 3200, openings: [] },
      ],
      calcs: [
        {
          id: "c1",
          roomId: "r1",
          tool: "laminat",
          toolVersion: 2,
          surface: "floor",
          input: { price_laminate: 1120 },
          openedAt: 1,
          addedAt: 1,
        },
        { id: "c2", roomId: "r1", tool: "plintus", toolVersion: 1, input: {}, openedAt: 2, addedAt: 2 },
        {
          id: "c3",
          roomId: "r2",
          tool: "plitka",
          toolVersion: 3,
          surface: "walls",
          input: { surface: "walls", tileWidthMm: 300, tileLengthMm: 600 },
          openedAt: 3,
          addedAt: 3,
        },
        { id: "c4", roomId: "r3", tool: "oboi", toolVersion: 4, surface: "walls", input: {}, openedAt: 4 },
      ],
      prices: {},
      activeRoomId: "r2",
      updatedAt: 4,
    },
  },
  version: 1,
};

async function open(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key as string, value as string);
        sessionStorage.setItem("seeded", "1");
      }
    },
    [KEY, JSON.stringify(seed)],
  );
  await page.goto(ESTIMATE);
  await expect(page.locator("[data-estimate]")).toBeVisible();
}

const stored = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.state.estimate, KEY);

test("an empty device gets the empty estimate with calculators to start from", async ({ page }) => {
  await page.goto(ESTIMATE);
  await expect(page.getByRole("heading", { level: 1, name: "Смета пока пустая" })).toBeVisible();
  await expect(page.locator("[data-estimate-empty] a").first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("rooms, rows in the order of works, shared consumables and the total", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ремонт квартиры" })).toBeVisible();
  const hall = page.locator('[data-room-card="Зал"]');
  await expect(hall.locator("[data-calc-row]")).toHaveCount(2);
  await expect(hall.locator("[data-calc-row]").first()).toContainText("Ламинат");
  await expect(hall.locator("[data-calc-row]").first()).toContainText("пол · + подложка");
  await expect(page.locator('[data-room-card="Ванная"]')).toContainText("Плитка");
  await expect(page.locator("[data-shared-card]")).toContainText("Плиточный клей");
  // The draft below the threshold is not in the estimate: the bedroom suggests the usual works instead.
  const bedroom = page.locator('[data-empty-room="Спальня"]');
  await expect(bedroom).toContainText("пока ничего не посчитано");
  await expect(bedroom.getByRole("link", { name: /ламинат/ })).toBeVisible();
  await expect(page.locator("[data-estimate-sum]")).toBeVisible();
  // Opening the page recounts the estimate and saves the header's totals (Р3).
  await expect.poll(async () => (await stored(page))?.totals?.sum).toBeGreaterThan(0);
});

test("a row opens its calculator with that room and calc", async ({ page }) => {
  await open(page);
  await page.locator('[data-room-card="Зал"] [data-calc-row] a').first().click();
  await expect(page).toHaveURL(/\/pol\/laminat\/$/);
  await expect(page.locator("[data-room-dimensions]")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Зал,/ })).toBeVisible();
  expect((await stored(page))?.activeRoomId).toBe("r1");
  // Below the result the sticky bar leads back to the estimate: «10 пачек · К смете».
  await page.mouse.wheel(0, 2500);
  await page.getByRole("link", { name: "К смете" }).click();
  await expect(page).toHaveURL(/\/smeta\/$/);
});

test("a row is removed with «Вернуть», the estimate renamed", async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-room-card="Зал"] [data-calc-row]');
  await page.getByRole("button", { name: "Убрать «Плинтус» из сметы" }).click();
  await expect(rows).toHaveCount(1);
  await page.getByRole("button", { name: "Вернуть", exact: true }).click();
  await expect(rows).toHaveCount(2);

  await page.getByRole("button", { name: "Переименовать смету" }).click();
  await page.getByRole("textbox", { name: "Название сметы" }).fill("Дача");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Дача" })).toBeVisible();
  expect((await stored(page))?.name).toBe("Дача");
});

test("a suggestion opens the calculator for the empty room", async ({ page }) => {
  await open(page);
  await page
    .locator('[data-empty-room="Спальня"]')
    .getByRole("link", { name: /ламинат/ })
    .click();
  await expect(page).toHaveURL(/\/pol\/laminat\/$/);
  expect((await stored(page))?.activeRoomId).toBe("r3");
});
