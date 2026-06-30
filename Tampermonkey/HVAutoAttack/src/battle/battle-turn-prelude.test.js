import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleTurnPreludeEvent, runBattleTurnPrelude } from "./battle-turn-prelude.js";

const mocks = vi.hoisted(() => ({
  killBug: vi.fn(),
  runBattleMonitorAutomation: vi.fn(),
  runBattleTurnRuntime: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
}));

vi.mock("../state/battle-turn.js", () => ({
  BattleTurnEvent: Object.freeze({ TURN_STARTED: "turnStarted" }),
  runBattleTurnAutomation: mocks.runBattleTurnRuntime,
}));
vi.mock("../monitor/battle-monitor-automation.js", () => ({
  BattleMonitorEvent: Object.freeze({ HUD_REFRESH: "hudRefresh" }),
  runBattleMonitorAutomation: mocks.runBattleMonitorAutomation,
}));
vi.mock("./kill-bug.js", () => ({ killBug: mocks.killBug }));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ ENSURE_READY: "ensureReady", UPDATE_HP: "updateHp" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleTurnPrelude", () => {
  it("runs the current turn prelude through one command entry", () => {
    expect(runBattleTurnPrelude({ type: BattleTurnPreludeEvent.PREPARE_CURRENT_TURN })).toBe(true);

    expect(mocks.runMonsterStatusAutomation).toHaveBeenNthCalledWith(1, {
      type: "ensureReady",
    });
    expect(mocks.runBattleTurnRuntime).toHaveBeenCalledWith({ type: "turnStarted" });
    expect(mocks.runBattleMonitorAutomation).toHaveBeenCalledWith({ type: "hudRefresh" });
    expect(mocks.killBug).toHaveBeenCalledTimes(1);
    expect(mocks.runMonsterStatusAutomation).toHaveBeenNthCalledWith(2, { type: "updateHp" });
  });

  it("ignores unknown prelude events", () => {
    expect(runBattleTurnPrelude({ type: "unknown" })).toBe(false);
    expect(mocks.killBug).not.toHaveBeenCalled();
  });
});
