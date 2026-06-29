import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleTurnAutomation } from "./main-loop.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  killBug: vi.fn(),
  prepareBattleTurnContext: vi.fn(),
  runBattleMonitorAutomation: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
  runBattleTurnRuntime: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
  runRules: vi.fn(),
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
vi.mock("./step-runner.js", () => ({ runRules: mocks.runRules }));
vi.mock("./rules/index.js", () => ({ BATTLE_RULES: [{ name: "testRule" }] }));
vi.mock("./turn-context.js", () => ({
  prepareBattleTurnContext: mocks.prepareBattleTurnContext,
}));
vi.mock("./pause-automation.js", () => ({
  BattlePauseEvent: Object.freeze({ RENDER_IF_PAUSED: "renderIfPaused" }),
  runBattlePauseAutomation: mocks.runBattlePauseAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.prepareBattleTurnContext.mockReturnValue({
    snap: { snap: true },
    battleRuleOptions: { ok: true },
  });
  mocks.runBattlePauseAutomation.mockReturnValue(false);
});

describe("runBattleTurnAutomation", () => {
  it("reports turn start through the battle turn entry before preparing context", () => {
    runBattleTurnAutomation();

    expect(mocks.runBattleTurnRuntime).toHaveBeenCalledWith({ type: "turnStarted" });
    expect(mocks.prepareBattleTurnContext).toHaveBeenCalledWith();
    expect(mocks.runRules).toHaveBeenCalledWith(
      [{ name: "testRule" }],
      { snap: true },
      { ok: true }
    );
  });
});
