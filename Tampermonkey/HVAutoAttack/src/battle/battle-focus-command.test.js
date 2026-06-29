import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleFocusCommandEvent, runBattleFocusCommand } from "./battle-focus-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));

beforeEach(() => {
  mocks.gE.mockReset();
});

describe("runBattleFocusCommand", () => {
  it("clicks Focus through one command entry", () => {
    const focus = { click: vi.fn() };
    mocks.gE.mockReturnValue(focus);

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(true);

    expect(mocks.gE).toHaveBeenCalledWith("#ckey_focus");
    expect(focus.click).toHaveBeenCalledTimes(1);
  });

  it("reports missing Focus without throwing", () => {
    mocks.gE.mockReturnValue(null);

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(false);
  });
});
