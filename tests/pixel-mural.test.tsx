import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PixelMural } from "../src/components/PixelMural";
import { buildMural } from "../src/lib/mural";

describe("PixelMural", () => {
  it("renders every selectable pixel and reports the selected coordinate", () => {
    const onSelect = vi.fn();
    render(
      <PixelMural
        board={buildMural([])}
        selected={{ x: 11, y: 7 }}
        onSelect={onSelect}
        livePaintCount={0}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(256);
    expect(screen.getByRole("button", { name: /^Pixel 11, 7\./ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^Pixel 4, 5\./ }));
    expect(onSelect).toHaveBeenCalledWith({ x: 4, y: 5 });
  });
});
