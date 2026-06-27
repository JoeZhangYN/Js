import { describe, expect, it, vi } from "vitest";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";

function makeDeps(previousTime = 1000, now = 1500) {
  const state = { timeNow: previousTime };
  return {
    state,
    deps: {
      now: vi.fn(() => now),
      read: vi.fn((key) => state[key]),
      write: vi.fn((key, value) => {
        state[key] = value;
      }),
    },
  };
}

describe("runBattleActionSpeedAutomation", () => {
  it("initializes battle action speed from the battle start event", () => {
    const { state, deps } = makeDeps(undefined, 1234);

    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.BATTLE_STARTED }, deps)
    ).toEqual({ runSpeed: 1 });

    expect(state).toMatchObject({ timeNow: 1234, runSpeed: 1 });
  });

  it("records action speed from the previous action timestamp", () => {
    const { state, deps } = makeDeps(1000, 1250);

    expect(
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }, deps)
    ).toEqual({ timeNow: 1250, runSpeed: "4.00" });

    expect(state).toMatchObject({ timeNow: 1250, runSpeed: "4.00" });
  });

  it("rejects unknown events", () => {
    expect(runBattleActionSpeedAutomation({ type: "unknown" }, makeDeps().deps)).toBeUndefined();
  });
});
