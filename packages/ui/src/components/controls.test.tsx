import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Segment } from "./Segment";
import { Stepper } from "./Stepper";

describe("Button", () => {
  it("defaults to type=button and blocks clicks while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Сохранить расчёт
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Сохранить расчёт" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-busy")).toBe("true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a link with button styles via asChild", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/pol/">Пол</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Пол" }).className).toContain("h-12");
  });
});

describe("Stepper", () => {
  function Harness() {
    const [value, setValue] = useState(1);
    return (
      <Stepper
        label="Двери"
        value={value}
        onValueChange={setValue}
        min={0}
        max={2}
        decrementLabel="Меньше"
        incrementLabel="Больше"
      />
    );
  }
  it("stays within bounds", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const more = screen.getByRole("button", { name: "Больше" });
    await user.click(more);
    expect(screen.getByRole("status").textContent).toBe("2");
    expect(more).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("button", { name: "Меньше" }));
    await user.click(screen.getByRole("button", { name: "Меньше" }));
    expect(screen.getByRole("status").textContent).toBe("0");
  });
});

describe("Segment", () => {
  it("switches value and never becomes empty", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Segment
        label="Способ"
        value="a"
        onValueChange={onChange}
        options={[
          { value: "a", label: "Прямая" },
          { value: "b", label: "Диагональ" },
        ]}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Прямая" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("radio", { name: "Диагональ" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
