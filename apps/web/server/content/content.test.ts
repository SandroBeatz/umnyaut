import "server-only";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { loadToolContent, parseToolContent } from "./load";
import { renderMarkdown, substituteNorms } from "./render";

const norms = {
  "underlay.overlap": { value: 200, unit: "мм", source: "test", checkedAt: "2026-10-09" },
  "laminate.waste": { value: 7.5, unit: "%", source: "test", checkedAt: "2026-10-09" },
};

const faq = (n: number, answer = "Ответ про {{norm.underlay.overlap}}") =>
  Array.from({ length: n }, (_, i) => `  - q: "Вопрос ${i + 1}"\n    a: "${answer}"`).join("\n");

const file = (
  over: Record<string, string> = {},
  faqCount = 3,
  body = "## Как считается\n\nНахлёст {{norm.underlay.overlap}}.",
  answer?: string,
) => {
  const fields = {
    title: '"Калькулятор ламината"',
    description: '"Запас {{ norm.laminate.waste }} на подрезку"',
    h1: '"Калькулятор ламината"',
    question: '"Сколько нужно ламината"',
    updatedAt: "2026-11-20",
    checkedAt: '"2026-11-12"',
    example: "{ lengthM: 4.6 }",
    ...over,
  };
  const yaml = Object.entries(fields)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${yaml}\nfaq:\n${faq(faqCount, answer)}\n---\n${body}\n`;
};

describe("substituteNorms", () => {
  it("inserts the formatted value with its unit", () => {
    expect(substituteNorms("{{norm.laminate.waste}} и {{ norm.underlay.overlap }}", norms)).toBe("7,5 % и 200 мм");
  });

  it("an unknown norm fails the build", () => {
    expect(() => substituteNorms("{{norm.nope}}", norms)).toThrow('unknown norm "nope"');
  });
});

describe("renderMarkdown", () => {
  it("renders Markdown and strips scripts, raw HTML and javascript: links", () => {
    const html = renderMarkdown("## Шаг\n\n<script>alert(1)</script><b>raw</b>\n\n[x](javascript:alert(1)) **жирный**");
    expect(html).toContain("<h2>Шаг</h2>");
    expect(html).toContain("<strong>жирный</strong>");
    expect(html).not.toMatch(/script|<b>|javascript:/);
  });
});

describe("parseToolContent", () => {
  it("parses a valid file: dates normalised, norms substituted everywhere, no warnings", () => {
    const content = parseToolContent(file(), "laminat.md", norms);
    expect(content.frontmatter).toMatchObject({
      updatedAt: "2026-11-20",
      checkedAt: "2026-11-12",
      example: { lengthM: 4.6 },
    });
    expect(content.frontmatter.description).toBe("Запас 7,5 % на подрезку");
    expect(content.html).toBe("<h2>Как считается</h2>\n<p>Нахлёст 200 мм.</p>");
    expect(content.faq[0]).toEqual({ q: "Вопрос 1", a: "<p>Ответ про 200 мм</p>" });
    expect(content.warnings).toEqual([]);
  });

  it("warns, but does not fail, when title, description, h1 or question are too long", () => {
    const long = (n: number) => `"${"я".repeat(n)}"`;
    const content = parseToolContent(
      file({ title: long(66), description: long(161), h1: long(41), question: long(43) }),
      "laminat.md",
      norms,
    );
    expect(content.warnings).toEqual([
      "laminat.md: title is 66 characters, limit 65",
      "laminat.md: description is 161 characters, limit 160",
      "laminat.md: h1 is 41 characters, limit 40",
      "laminat.md: question is 43 characters, limit 42",
    ]);
  });

  it("fails without an example, with fewer than 3 FAQ, a bad date or an unknown norm", () => {
    expect(() => parseToolContent(file({ example: "" }), "a.md", norms)).toThrow(/^a\.md: example:/);
    expect(() => parseToolContent(file({ example: "{}" }), "a.md", norms)).toThrow(
      "example must set at least one field",
    );
    expect(() => parseToolContent(file({}, 2), "a.md", norms)).toThrow("at least 3 FAQ entries");
    expect(() => parseToolContent(file({ updatedAt: '"20.11.2026"' }), "a.md", norms)).toThrow(/updatedAt/);
    expect(() => parseToolContent(file({}, 3, "{{norm.missing}}"), "a.md", norms)).toThrow(
      'a.md: unknown norm "missing"',
    );
  });
});

describe("loadToolContent", () => {
  it("returns undefined without a file and prints length warnings once", () => {
    const dir = mkdtempSync(join(tmpdir(), "content-"));
    expect(loadToolContent("nothing", dir)).toBeUndefined();
    // Catalog norms are empty until the first tool, so this file uses none.
    const plain = file({ h1: `"${"я".repeat(41)}"`, description: '"Описание"' }, 3, "Текст без норм.", "Ответ");
    writeFileSync(join(dir, "plain.md"), plain);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadToolContent("plain", dir)?.html).toBe("<p>Текст без норм.</p>");
    expect(loadToolContent("plain", dir)).toBeDefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("⚠ content/tools/plain.md: h1 is 41 characters, limit 40");
    warn.mockRestore();
  });
});
