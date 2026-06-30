import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isSpiritActive: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isSpiritActive: mocks.isSpiritActive }));
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
  it("clicks Spirit and records the current global turn through one command", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);

    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD })
    ).toBe(true);

    expect(mocks.gE).toHaveBeenCalledWith("#ckey_spirit");
    expect(spirit.click).toHaveBeenCalledTimes(1);
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readGlobalTurn" });
    expect(mocks.g).toHaveBeenCalledWith("lastSpiritToggleGlobalTurn", 12);
  });

  it("does not record a toggle when the Spirit button is missing", () => {
    mocks.gE.mockReturnValue(null);

    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD })
    ).toBe(false);

    expect(mocks.runCdRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalledWith("lastSpiritToggleGlobalTurn", expect.anything());
  });

  it("activates inactive Spirit and records cooldown through the command", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);
    mocks.isSpiritActive.mockReturnValue(false);

    expect(
      runBattleSpiritToggleAutomation({
        type: BattleSpiritToggleEvent.ACTIVATE_IF_INACTIVE,
      })
    ).toBe(true);

    expect(mocks.isSpiritActive).toHaveBeenCalledWith(spirit);
    expect(spirit.click).toHaveBeenCalledTimes(1);
    expect(mocks.g).toHaveBeenCalledWith("lastSpiritToggleGlobalTurn", 12);
  });

  it("does not click or record when Spirit is already active", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);
    mocks.isSpiritActive.mockReturnValue(true);

    expect(
      runBattleSpiritToggleAutomation({
        type: BattleSpiritToggleEvent.ACTIVATE_IF_INACTIVE,
      })
    ).toBe(false);

    expect(spirit.click).not.toHaveBeenCalled();
    expect(mocks.runCdRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalledWith("lastSpiritToggleGlobalTurn", expect.anything());
  });

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

  it("reads whether Spirit is currently active through the entry", () => {
    const spirit = {};
    mocks.gE.mockReturnValue(spirit);
    mocks.isSpiritActive.mockReturnValue(true);

    expect(runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.READ_ACTIVE })).toBe(
      true
    );
    expect(mocks.gE).toHaveBeenCalledWith("#ckey_spirit");
    expect(mocks.isSpiritActive).toHaveBeenCalledWith(spirit);
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
