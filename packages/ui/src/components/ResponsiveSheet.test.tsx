import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveSheet } from "./ResponsiveSheet";

function mockWidth(desktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: desktop,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const ui = (
  <ResponsiveSheet title="Моя комната" closeLabel="Закрыть" trigger={<button type="button">Изменить</button>}>
    <p>Поля</p>
  </ResponsiveSheet>
);

describe("ResponsiveSheet", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is a centred dialog with a close button from 1024 px", async () => {
    mockWidth(true);
    render(ui);
    await userEvent.click(screen.getByRole("button", { name: "Изменить" }));
    const dialog = screen.getByRole("dialog", { name: "Моя комната" });
    expect(dialog.className).toContain("max-w-[480px]");
    expect(screen.getByRole("button", { name: "Закрыть" })).toBeTruthy();
  });

  it("is a bottom sheet on the phone", async () => {
    mockWidth(false);
    render(ui);
    await userEvent.click(screen.getByRole("button", { name: "Изменить" }));
    const dialog = screen.getByRole("dialog", { name: "Моя комната" });
    expect(dialog.className).toContain("bottom-0");
    expect(screen.queryByRole("button", { name: "Закрыть" })).toBeNull();
  });
});
