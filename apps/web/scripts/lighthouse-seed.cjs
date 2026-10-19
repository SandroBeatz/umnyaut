// Lighthouse CI puppeteer script (P17.15): before each audited URL, puts a filled list of purchases into
// localStorage — three rooms, six calcs, shared adhesive, grout and primer — so the tool page and `/spisok/` are
// measured the way a returning visitor sees them. Lighthouse keeps localStorage between runs (lighthouserc.estimate.cjs).
const estimate = {
  schemaVersion: 2,
  id: "lighthouse",
  name: "Ремонт квартиры",
  country: "RU",
  rooms: [
    { id: "r1", name: "Зал", type: "living", lengthMm: 4600, widthMm: 4300, heightMm: 2700, openings: [] },
    { id: "r2", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1700, heightMm: 2500, openings: [] },
    { id: "r3", name: "Кухня", type: "kitchen", lengthMm: 3000, widthMm: 2800, heightMm: 2700, openings: [] },
  ],
  calcs: [
    { id: "c1", roomId: "r1", tool: "laminat", toolVersion: 2, surface: "floor", input: { price_laminate: 1120 } },
    { id: "c2", roomId: "r1", tool: "plintus", toolVersion: 1, input: {} },
    { id: "c3", roomId: "r1", tool: "oboi", toolVersion: 6, surface: "walls", input: {} },
    { id: "c4", roomId: "r2", tool: "plitka", toolVersion: 5, surface: "walls", input: { price_tile: 1650 } },
    { id: "c5", roomId: "r2", tool: "plitka", toolVersion: 5, surface: "floor", input: {} },
    { id: "c6", roomId: "r3", tool: "plitka", toolVersion: 5, surface: "floor", input: {} },
  ].map((calc, i) => ({ ...calc, openedAt: i + 1, addedAt: i + 1 })),
  prices: {},
  activeRoomId: "r2",
  updatedAt: 6,
};

/** @param {import('puppeteer-core').Browser} browser @param {{ url: string }} context */
module.exports = async (browser, { url }) => {
  const page = await browser.newPage();
  await page.goto(new URL("/api/health/", url).href);
  await page.evaluate(
    (value) => localStorage.setItem("umnyaut:estimate:v1", value),
    JSON.stringify({ state: { estimate }, version: 1 }),
  );
  await page.close();
};
