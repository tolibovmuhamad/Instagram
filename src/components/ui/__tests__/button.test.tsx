import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Войти</Button>);
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Отправить</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Сохранить
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
