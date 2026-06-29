import { describe, expect, it, vi } from "vitest";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

const mocks = vi.hoisted(() => ({
  joinMonsterView: vi.fn(() => [{ order: 0, monsterId: 101 }]),
  runMonsterCacheAutomation: vi.fn(() => ({ 101: { monsterId: 101 } })),
  runMonsterStatusAutomation: vi.fn(() => [{ order: 0, monsterId: 101 }]),
}));

vi.mock("./monster-view.js", () => ({ joinMonsterView: mocks.joinMonsterView }));
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
      view: [{ order: 0, monsterId: 101 }],
      monsterStatus: [{ order: 0, monsterId: 101 }],
    });

    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({ type: "readStatus" });
    expect(mocks.runMonsterCacheAutomation).toHaveBeenCalledWith({ type: "readDb" });
    expect(mocks.joinMonsterView).toHaveBeenCalledWith(monsters, [{ order: 0, monsterId: 101 }], {
      101: { monsterId: 101 },
    });
  });
});
