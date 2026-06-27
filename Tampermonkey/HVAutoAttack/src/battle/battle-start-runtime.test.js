import { describe, expect, it, vi } from "vitest";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";

describe("runBattleStartRuntimeAutomation", () => {
  it("initializes battle runtime attack mode and action speed", () => {
    const deps = {
      readOption: vi.fn(() => ({ attackStatus: "magic" })),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };

    expect(
      runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED }, deps)
    ).toBe(true);

    expect(deps.write).toHaveBeenCalledWith("attackStatus", "magic");
    expect(deps.startSpeed).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown events", () => {
    expect(runBattleStartRuntimeAutomation({ type: "unknown" })).toBe(false);
  });
});
