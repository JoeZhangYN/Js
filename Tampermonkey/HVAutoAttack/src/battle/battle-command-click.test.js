import { describe, expect, it, vi } from "vitest";
import { clickBattleCommandElement } from "./battle-command-click.js";

describe("clickBattleCommandElement", () => {
  it("returns clicked for successful command clicks", () => {
    const element = { click: vi.fn() };

    expect(clickBattleCommandElement(element)).toEqual({ clicked: true });
    expect(element.click).toHaveBeenCalledOnce();
  });

  it("returns structured failure instead of throwing when command click fails", () => {
    const element = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
    };

    expect(clickBattleCommandElement(element)).toEqual({
      clicked: false,
      reason: "clickFailed",
      error: "blocked",
    });
  });
});
