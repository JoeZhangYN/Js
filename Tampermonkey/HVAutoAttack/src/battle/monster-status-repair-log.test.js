import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const mocks = vi.hoisted(() => ({
  runBattleRoundStartLog: vi.fn(),
  runNavigationAutomation: vi.fn(),
}));

vi.mock("./round-start-log.js", () => ({
  BattleRoundStartLogEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleRoundStartLog: mocks.runBattleRoundStartLog,
}));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ RELOAD_NOW: "reloadNow" }),
  NavigationReloadReason: Object.freeze({ MONSTER_STATUS_REPAIR: "monsterStatusRepair" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '<div class="btm2"></div><div class="btm2"></div>';
  mocks.runBattleRoundStartLog.mockReset();
  mocks.runNavigationAutomation.mockReset();
});

describe("monster status repair log snapshot", () => {
  it("repairs initialized monster status from the round-start log entry", () => {
    mocks.runBattleRoundStartLog.mockReturnValue({
      rows: [
        "Spawned Monster B: MID=202 (Beta) LV=10 HP=2000",
        "Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000",
        "Initializing the battle... (Round 1 / 1)",
      ],
      firstText: "Spawned Monster B: MID=202 (Beta) LV=10 HP=2000",
      initializingText: "Initializing the battle... (Round 1 / 1)",
    });

    expect(runMonsterStatusAutomation({ type: MonsterStatusEvent.REPAIR })).toBe(true);

    expect(mocks.runBattleRoundStartLog).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(getValue(STORAGE_KEYS.MONSTER_STATUS, true)).toEqual([
      expect.objectContaining({ order: 0, monsterId: 101, hp: 1000 }),
      expect.objectContaining({ order: 1, monsterId: 202, hp: 2000 }),
    ]);
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "reloadNow",
      reason: "monsterStatusRepair",
      detail: {
        source: "monsterStatusRepair",
        repairSource: "roundStartLog",
        monsterAll: 2,
      },
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleMonsterStatusRepair"))).toMatchObject({
      result: "scheduledReload",
      reason: "roundStartLog",
      detail: {
        source: "monsterStatusRepair",
        repairSource: "roundStartLog",
        monsterAll: 2,
      },
    });
  });
});
