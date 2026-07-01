import { describe, expect, it, vi } from "vitest";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";

function makeDeps(previousTime = 1000, now = 1500) {
  const state = { timeNow: previousTime };
  const sessionStorage = { setItem: vi.fn() };
  return {
    state,
    deps: {
      now: vi.fn(() => now),
      read: vi.fn((key) => state[key]),
      write: vi.fn((key, value) => {
        state[key] = value;
      }),
      sessionStorage,
      debug: vi.fn(),
    },
  };
}

describe("runBattleActionSpeedAutomation", () => {
  it("initializes battle action speed from the battle start event", () => {
    const { state, deps } = makeDeps(undefined, 1234);

    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.BATTLE_STARTED }, deps)
    ).toEqual({ runSpeed: "1.00" });

    expect(state).toMatchObject({ timeNow: 1234, runSpeed: "1.00" });
  });

  it("records action speed from the previous action timestamp", () => {
    const { state, deps } = makeDeps(1000, 1250);

    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }, deps)
    ).toEqual({ timeNow: 1250, runSpeed: "4.00" });

    expect(state).toMatchObject({ timeNow: 1250, runSpeed: "4.00" });
  });

  it("reads current battle action speed through the entry", () => {
    const { deps, state } = makeDeps();
    state.runSpeed = "3.25";

    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.READ_CURRENT }, deps)
    ).toBe("3.25");

    expect(deps.read).toHaveBeenCalledWith("runSpeed");
  });

  it("normalizes invalid action speed runtime values through the entry", () => {
    const { deps, state } = makeDeps("bad", "also bad");
    state.runSpeed = "fast";

    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }, deps)
    ).toEqual({ timeNow: 0, runSpeed: "0.00" });
    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.READ_CURRENT }, deps)
    ).toBe("0.00");
  });

  it("records rejected unknown events without reading or writing runtime state", () => {
    const { deps } = makeDeps();

    expect(runBattleActionSpeedAutomation({ type: "unknown" }, deps)).toBe(false);

    expect(deps.now).not.toHaveBeenCalled();
    expect(deps.read).not.toHaveBeenCalled();
    expect(deps.write).not.toHaveBeenCalled();
    expect(deps.sessionStorage.setItem).toHaveBeenCalledWith(
      "HVAA:lastBattleActionSpeed",
      expect.stringContaining('"reason":"unknownActionSpeedEvent"')
    );
  });

  it("records rejected null events without reading or writing runtime state", () => {
    const { deps } = makeDeps();

    expect(runBattleActionSpeedAutomation(null, deps)).toBe(false);

    expect(deps.now).not.toHaveBeenCalled();
    expect(deps.read).not.toHaveBeenCalled();
    expect(deps.write).not.toHaveBeenCalled();
    expect(deps.sessionStorage.setItem).toHaveBeenCalledWith(
      "HVAA:lastBattleActionSpeed",
      expect.stringContaining('"eventType":null')
    );
  });
});
