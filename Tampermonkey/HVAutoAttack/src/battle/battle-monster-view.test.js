import { describe, expect, it, vi } from "vitest";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

const mocks = vi.hoisted(() => ({
  joinMonsterView: vi.fn(() => [
    { order: 0, monsterId: 101, name: "Alpha", isDead: false, hpPercent: 0.4 },
  ]),
  monsterHpVars: vi.fn(() => ({
    firstMonsterHpPercent: 40,
    lowestMonsterHpPercent: 40,
    soloMonsterHpPercent: 40,
  })),
  runMonsterCacheAutomation: vi.fn(() => ({ 101: { monsterId: 101 } })),
  runMonsterStatusAutomation: vi.fn(() => [{ order: 0, monsterId: 101 }]),
}));

vi.mock("./monster-view.js", () => ({
  joinMonsterView: mocks.joinMonsterView,
  monsterHpVars: mocks.monsterHpVars,
}));
vi.mock("../state/monster-cache.js", () => ({
  MonsterCacheEvent: Object.freeze({ READ_DB: "readDb" }),
  runMonsterCacheAutomation: mocks.runMonsterCacheAutomation,
}));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_STATUS: "readStatus" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));

describe("battle monster view", () => {
  it("builds the current unified monster view through status and cache entries", () => {
    const monsters = [{ order: 0, name: "Alpha" }];

    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_VIEW, monsters })).toEqual({
      view: [{ order: 0, monsterId: 101, name: "Alpha", isDead: false, hpPercent: 0.4 }],
      monsterIdentities: [{ monsterId: 101, name: "Alpha" }],
      aliveCount: 1,
      firstMonsterHpPercent: 40,
      lowestMonsterHpPercent: 40,
      soloMonsterHpPercent: 40,
    });

    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({ type: "readStatus" });
    expect(mocks.runMonsterCacheAutomation).toHaveBeenCalledWith({ type: "readDb" });
    expect(mocks.joinMonsterView).toHaveBeenCalledWith(monsters, [{ order: 0, monsterId: 101 }], {
      101: { monsterId: 101 },
    });
    expect(mocks.monsterHpVars).toHaveBeenCalledWith([
      { order: 0, monsterId: 101, name: "Alpha", isDead: false, hpPercent: 0.4 },
    ]);
  });
});
