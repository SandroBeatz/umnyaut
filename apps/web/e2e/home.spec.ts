import { expect, type Page, test } from "@playwright/test";

async function type(page: Page, label: string, value: string) {
  const field = page.getByRole("textbox", { name: label, exact: true });
  await field.fill(value);
  await field.blur();
}

const card = (page: Page, title: string) => page.getByRole("link", { name: new RegExp(`^${title}:`) });

test("home: the room block recomputes the example and carries over to a tool", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Калькулятор материалов для ремонта. Одна комната — весь список покупок",
  );
  await expect(page.getByRole("heading", { name: "Какую комнату считаем?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Для комнаты 12 м² нужно" })).toBeVisible();
  await expect(card(page, "Ламинат")).toContainText("6 пачек");

  await type(page, "Длина", "6");
  await expect(page.getByRole("heading", { name: "Для комнаты 18 м² нужно" })).toBeVisible();
  await expect(card(page, "Ламинат")).not.toContainText("6 пачек");

  // The room type picks the cards: a bathroom gets tile, not laminate.
  await page.getByRole("button", { name: "Ванная", exact: true }).click();
  await expect(card(page, "Плитка")).toBeVisible();
  await expect(card(page, "Ламинат")).toHaveCount(0);

  // «Посчитать материалы» saves the room and offers the type's usual calculators in a popup.
  await page.getByRole("button", { name: "Посчитать материалы" }).click();
  const popup = page.getByRole("dialog", { name: "Что считаем: Ванная" });
  await expect(popup).toBeVisible();
  await expect(popup.getByRole("link", { name: /^Посчитать плитка/ })).toBeVisible();
  await popup.getByRole("button", { name: "Все расчёты" }).click();
  await expect(popup).toBeHidden();
  await expect(page.getByRole("heading", { name: "Строительный калькулятор: что рассчитать" })).toBeFocused();

  await page.getByRole("link", { name: /^Пол/ }).first().click();
  await expect(page).toHaveURL("/pol/");
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^6\s×\s3\s×\s2,7\sм$/);

  // Category: work order leads into the tools, the room comes along.
  await expect(page.getByRole("heading", { name: "Порядок работ" })).toBeVisible();
  await page.getByRole("link", { name: "Плинтус", exact: true }).click();
  await expect(page).toHaveURL("/pol/plintus/");
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^6\s×\s3\s×\s2,7\sм$/);
});

test("home: a suggested calculator opens with the room", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Кухня", exact: true }).click();
  await page.getByRole("button", { name: "Посчитать материалы" }).click();
  await page.getByRole("link", { name: /^Посчитать плитка для комнаты «Кухня»/ }).click();
  await expect(page).toHaveURL("/plitka/plitka/");
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^4\s×\s3\s×\s2,7\sм$/);
});

/** Two rooms in the list with saved totals: the block greets with «Ваш ремонт». */
const seed = {
  state: {
    estimate: {
      schemaVersion: 2,
      id: "e2e",
      name: "Ремонт квартиры",
      country: "RU",
      rooms: [
        { id: "r1", name: "Зал", type: "living", lengthMm: 4600, widthMm: 4300, heightMm: 2700, openings: [] },
        { id: "r2", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1900, heightMm: 2500, openings: [] },
      ],
      calcs: [
        { id: "c1", roomId: "r1", tool: "laminat", toolVersion: 2, input: {}, openedAt: 1, addedAt: 1 },
        { id: "c2", roomId: "r2", tool: "plitka", toolVersion: 3, input: {}, openedAt: 2, addedAt: 2 },
      ],
      prices: {},
      totals: { sum: 52000, byRoom: { r1: 40000, r2: 12000 }, saved: 0, missing: 0, at: 2 },
      activeRoomId: "r1",
      updatedAt: 2,
    },
  },
  version: 1,
};

test("home: with calcs in the list the block shows «Ваш ремонт» and adds a room", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key as string, value as string);
        sessionStorage.setItem("seeded", "1");
      }
    },
    ["umnyaut:estimate:v1", JSON.stringify(seed)],
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ваш ремонт" })).toBeVisible();
  await expect(page.getByText("2 комнаты")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Зал: открыть расчёт/ })).toContainText("40 000");
  await expect(page.getByText("Итого по списку")).toBeVisible();

  // «Добавить комнату» opens the room editor; its button is «Посчитать материалы», then the room's calculators.
  await page.getByRole("button", { name: "Добавить комнату" }).click();
  const editor = page.getByRole("dialog", { name: "Новая комната" });
  // Living room and bathroom are taken: the new room starts as a bedroom.
  await expect(editor.getByRole("textbox", { name: "Название" })).toHaveValue("Спальня");
  await expect(editor.getByRole("button", { name: "Спальня", exact: true })).toHaveAttribute("aria-pressed", "true");
  await editor.getByRole("textbox", { name: "Длина", exact: true }).fill("3,8");
  await editor.getByRole("textbox", { name: "Ширина", exact: true }).fill("3,2");
  await editor.getByRole("button", { name: "Посчитать материалы" }).click();
  await expect(editor).toBeHidden();
  const popup = page.getByRole("dialog", { name: "Что считаем: Спальня" });
  await expect(popup.getByRole("link", { name: /^Посчитать ламинат для комнаты «Спальня»/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(page.getByText("3 комнаты")).toBeVisible();

  await page.getByRole("link", { name: "Открыть список" }).click();
  await expect(page).toHaveURL("/spisok/");
});

test("home: doors and windows open the room editor and come off the walls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Окна и двери: 1 дверь")).toBeVisible();
  const walls = page.locator("dd").nth(1);
  const before = await walls.textContent();

  await page.getByRole("button", { name: "Изменить окна и двери" }).click();
  const editor = page.getByRole("dialog", { name: "Комната" });
  await editor.getByRole("button", { name: "Окно", exact: true }).click();
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();

  await expect(page.getByText("Окна и двери: 1 дверь, 1 окно")).toBeVisible();
  await expect(walls).not.toHaveText(before ?? "");
});
