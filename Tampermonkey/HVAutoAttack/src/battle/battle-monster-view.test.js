import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

const mocks = vi.hoisted(() => ({
  joinMonsterView: vi.fn(() => [
    { order: 0, monsterId: 101, name: "Alpha", isDead: false, hpPercent: 0.4 },
  ]),
  aliveByOrder: vi.fn((view) => [...(view || [])].filter((monster) => !monster.isDead)),
  byOrder: vi.fn((view) => [...(view || [])].sort((a, b) => a.order - b.order)),
  monsterHpVars: vi.fn(() => ({
    firstMonsterHpPercent: 40,
    lowestMonsterHpPercent: 40,
    soloMonsterHpPercent: 40,
  })),
  runMonsterCacheAutomation: vi.fn(() => ({ 101: { monsterId: 101 } })),
  runMonsterStatusAutomation: vi.fn(() => [{ order: 0, monsterId: 101 }]),
}));

vi.mock("./monster-view.js", () => ({
  aliveByOrder: mocks.aliveByOrder,
  byOrder: mocks.byOrder,
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

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
});

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
    expect(mocks.joinMonsterView).not.toHaveBeenCalled();
    expect(mocks.monsterHpVars).not.toHaveBeenCalled();
  });

  it("routes monster ordering queries through the entry without reading status or cache", () => {
    const view = [
      { id: 2, order: 2, isDead: false },
      { id: 1, order: 1, isDead: true },
    ];

    expect(
      runBattleMonsterView({ type: BattleMonsterViewEvent.READ_ALIVE_BY_ORDER, view })
    ).toEqual([{ id: 2, order: 2, isDead: false }]);
    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_BY_ORDER, view })).toEqual([
      { id: 1, order: 1, isDead: true },
      { id: 2, order: 2, isDead: false },
    ]);
    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_HP_VARS, view })).toEqual({
      firstMonsterHpPercent: 40,
      lowestMonsterHpPercent: 40,
      soloMonsterHpPercent: 40,
    });

    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterCacheAutomation).not.toHaveBeenCalled();
    expect(mocks.aliveByOrder).toHaveBeenCalledWith(view);
    expect(mocks.byOrder).toHaveBeenCalledWith(view);
    expect(mocks.monsterHpVars).toHaveBeenCalledWith(view);
  });
});
