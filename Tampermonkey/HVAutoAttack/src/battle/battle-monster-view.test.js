import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

const mocks = vi.hoisted(() => ({
  runMonsterCacheAutomation: vi.fn(() => ({ 101: { monsterId: 101 } })),
  runMonsterStatusAutomation: vi.fn(() => [
    { order: 0, monsterId: 101, hp: 1000, hpNow: 400, finWeight: 1 },
  ]),
}));

vi.mock("../state/monster-cache.js", () => ({
  MonsterCacheEvent: Object.freeze({ READ_DB: "readDb" }),
  runMonsterCacheAutomation: mocks.runMonsterCacheAutomation,
}));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_STATUS: "readStatus" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("battle monster view", () => {
  it("builds the current unified monster view through status and cache entries", () => {
    const monsters = [{ order: 0, name: "Alpha", isDead: false, hpRatio: 0.4 }];

    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_VIEW, monsters })).toEqual({
      view: [
        {
          id: undefined,
          order: 0,
          monsterId: 101,
          level: undefined,
          name: "Alpha",
          isDead: false,
          isBoss: undefined,
          monsterClass: undefined,
          powerLevel: undefined,
          attackType: undefined,
          buffs: undefined,
          buffEffects: undefined,
          hpPercent: 0.4,
          hpAbsNow: 400,
          hpMax: 1000,
          inferredMaxHP: undefined,
          finWeight: 1,
          resists: undefined,
          dbProfile: { monsterId: 101 },
          dbMaxHP: undefined,
        },
      ],
      monsterIdentities: [{ monsterId: 101, name: "Alpha" }],
      aliveCount: 1,
      firstMonsterHpPercent: 40,
      lowestMonsterHpPercent: 40,
      soloMonsterHpPercent: 40,
    });

    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({ type: "readStatus" });
    expect(mocks.runMonsterCacheAutomation).toHaveBeenCalledWith({ type: "readDb" });
  });

  it("rejects unknown events without reading status, cache, or deriving view", () => {
    expect(runBattleMonsterView({ type: "unknown", monsters: [{ order: 0 }] })).toEqual({
      view: [],
      monsterIdentities: [],
      aliveCount: 0,
      soloMonsterHpPercent: 100,
      lowestMonsterHpPercent: 100,
      firstMonsterHpPercent: 100,
    });

    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterCacheAutomation).not.toHaveBeenCalled();
  });

  it("routes monster ordering queries through the entry without reading status or cache", () => {
    const view = [
      { id: 2, order: 2, isDead: false, hpPercent: 0.5 },
      { id: 1, order: 1, isDead: true },
    ];

    expect(
      runBattleMonsterView({ type: BattleMonsterViewEvent.READ_ALIVE_BY_ORDER, view })
    ).toEqual([{ id: 2, order: 2, isDead: false, hpPercent: 0.5 }]);
    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_BY_ORDER, view })).toEqual([
      { id: 1, order: 1, isDead: true },
      { id: 2, order: 2, isDead: false, hpPercent: 0.5 },
    ]);
    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_HP_VARS, view })).toEqual({
      firstMonsterHpPercent: 50,
      lowestMonsterHpPercent: 50,
      soloMonsterHpPercent: 50,
    });

    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterCacheAutomation).not.toHaveBeenCalled();
  });
});
