import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "./NumberField";

function Harness({ initial = null, onChange }: { initial?: number | null; onChange?: (v: number | null) => void }) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <>
      <NumberField
        label="Длина комнаты"
        unit="м"
        value={value}
        min={0.5}
        max={30}
        required
        messages={{ range: "От 0,5 до 30 м", required: "Введите длину" }}
        onValueChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
      <output data-testid="value">{String(value)}</output>
      <button type="button" onClick={() => setValue(7)}>
        preset
      </button>
    </>
  );
}

const field = () => screen.getByLabelText("Длина комнаты");

describe("NumberField", () => {
  it("accepts a comma and a dot as the decimal separator", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(field(), "4,6");
    expect(screen.getByTestId("value").textContent).toBe("4.6");
    await user.clear(field());
    await user.type(field(), "3.25");
    expect(field()).toHaveProperty("value", "3,25");
    expect(screen.getByTestId("value").textContent).toBe("3.25");
  });

  it("uses the decimal keyboard and names the unit", () => {
    render(<Harness />);
    expect(field().getAttribute("inputmode")).toBe("decimal");
    expect(field().getAttribute("aria-describedby")).toContain("unit");
  });

  it("empty → null; required error only after blur", async () => {
    const user = userEvent.setup();
    render(<Harness initial={4} />);
    await user.clear(field());
    expect(screen.getByTestId("value").textContent).toBe("null");
    expect(screen.queryByText("Введите длину")).toBeNull();
    await user.tab();
    expect(screen.getByText("Введите длину")).toBeTruthy();
    expect(field().getAttribute("aria-invalid")).toBe("true");
  });

  it("validates the range on blur, not while typing, and clears the error on edit", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(field(), "45");
    expect(screen.queryByText("От 0,5 до 30 м")).toBeNull();
    await user.tab();
    expect(screen.getByText("От 0,5 до 30 м")).toBeTruthy();
    await user.type(field(), "{backspace}");
    expect(screen.queryByText("От 0,5 до 30 м")).toBeNull();
  });

  it("parses pasted text with spaces and units", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(field());
    await user.paste("1 200,5 м");
    expect(field()).toHaveProperty("value", "1200,5");
    expect(onChange).toHaveBeenLastCalledWith(1200.5);
  });

  it("ignores letters while typing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(field(), "4a,b6");
    expect(field()).toHaveProperty("value", "4,6");
  });

  it("follows outside value changes", async () => {
    const user = userEvent.setup();
    render(<Harness initial={4} />);
    await user.click(screen.getByText("preset"));
    expect(field()).toHaveProperty("value", "7");
  });
});
