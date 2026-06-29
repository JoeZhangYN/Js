import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
}));

vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ READ_GLOBAL_TURN: "readGlobalTurn" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));

beforeEach(() => {
  const state = { lastSpiritToggleGlobalTurn: 7 };
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.g.mockImplementation((key, value) => {
    if (value !== undefined) {
      state[key] = value;
      return value;
    }
    return state[key];
  });
  mocks.runCdRuntimeAutomation.mockReturnValue(12.8);
});

describe("runBattleSpiritToggleAutomation", () => {
  it("records the current global turn through the CD runtime entry", () => {
    expect(runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.RECORD_TOGGLE })).toBe(
      12
    );

    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readGlobalTurn" });
    expect(mocks.g).toHaveBeenCalledWith("lastSpiritToggleGlobalTurn", 12);
  });

  it("reads the last Spirit toggle turn through the entry", () => {
    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.READ_LAST_TOGGLE })
    ).toBe(7);
  });

  it("normalizes invalid Spirit toggle turns through the entry", () => {
    mocks.runCdRuntimeAutomation.mockReturnValue("bad");
    expect(runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.RECORD_TOGGLE })).toBe(
      0
    );
    expect(mocks.g).toHaveBeenCalledWith("lastSpiritToggleGlobalTurn", 0);

    mocks.g.mockImplementation((key, value) => (value !== undefined ? value : "bad"));
    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.READ_LAST_TOGGLE })
    ).toBe(0);
  });
});
