import { describe, expect, it } from "vitest";
import { ld, openGraph } from "./seo";

describe("structured data", () => {
  it("FAQ answers become plain text", () => {
    const data = ld.faq([{ q: "Сколько?", a: "<p>Около <strong>10</strong>&nbsp;пачек &amp; подложка</p>" }]);
    expect(data.mainEntity[0]?.acceptedAnswer.text).toBe("Около 10 пачек & подложка");
  });

  it("breadcrumbs are numbered with absolute URLs", () => {
    const data = ld.breadcrumbs([
      { name: "Главная", path: "/" },
      { name: "Пол", path: "/pol/" },
    ]);
    expect(data.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, "https://umnyaut.com/"],
      [2, "https://umnyaut.com/pol/"],
    ]);
  });

  it("every page's Open Graph keeps the shared image", () => {
    expect(openGraph("T", "D", "/pol/").images).toHaveLength(1);
  });
});
