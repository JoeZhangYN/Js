// monster-view join SSOT 回归锁：三面 join 正确性（核心 R1：monsterStatus 被 finWeight sort
// 后乱序，仍须按 order 字段对齐而非数组下标）+ db/status 缺失降级 + 派生量口径。
import { describe, it, expect, vi } from "vitest";
import { RESIST_KEYS } from "../data/monster-db.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

const mocks = vi.hoisted(() => ({
  runMonsterCacheAutomation: vi.fn(() => ({})),
  runMonsterStatusAutomation: vi.fn(() => []),
}));

vi.mock("../state/monster-cache.js", () => ({
  MonsterCacheEvent: Object.freeze({ READ_DB: "readDb" }),
  runMonsterCacheAutomation: mocks.runMonsterCacheAutomation,
}));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_STATUS: "readStatus" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));

/** snap.monsters 形态怪物 */
const sm = (over = {}) => ({
  id: 1,
  order: 0,
  isDead: false,
  isBoss: false,
  name: "X",
  hpRatio: 1,
  buffs: [],
  buffEffects: [],
  ...over,
});
/** monsterStatus 形态记录（含 monsterId/level；库 join 现按 MID 而非 name） */
const st = (over = {}) => ({
  id: 1,
  order: 0,
  monsterId: 100,
  level: 365,
  isDead: false,
  hp: 1000,
  hpNow: 1000,
  finWeight: 1,
  ...over,
});
/** 满九抗库记录 */
const fullDb = (over = {}) => ({
  monsterName: "X",
  monsterClass: "Arthropod",
  plvl: 300,
  attack: "Piercing",
  fire: 50,
  cold: -20,
  elec: 0,
  wind: 10,
  holy: -50,
  dark: 30,
  crushing: 5,
  slashing: -10,
  piercing: 0,
  lastUpdate: "2026-06-25",
  ...over,
});

describe("joinMonsterView", () => {
  function readView(snapMonsters, monsterStatus, dbById = {}) {
    mocks.runMonsterStatusAutomation.mockReturnValueOnce(monsterStatus);
    mocks.runMonsterCacheAutomation.mockReturnValueOnce(dbById);
    return runBattleMonsterView({ type: BattleMonsterViewEvent.READ_VIEW, monsters: snapMonsters })
      .view;
  }

  it("R1: monsterStatus 被 finWeight sort 乱序 → 仍按 order 字段对齐(非下标)", () => {
    const view = readView(
      [
        sm({ id: 1, order: 0, name: "A", hpRatio: 0.5 }),
        sm({ id: 2, order: 1, name: "B", hpRatio: 0.9 }),
        sm({ id: 3, order: 2, name: "C", hpRatio: 0.3 }),
      ],
      [
        st({ order: 2, id: 3, hp: 1000, hpNow: 300, finWeight: 1 }),
        st({ order: 0, id: 1, hp: 2000, hpNow: 1000, finWeight: 2 }),
        st({ order: 1, id: 2, hp: 5000, hpNow: 4500, finWeight: 3 }),
      ]
    );
    // view[0] = order 0 = id 1：按 order 对齐应拿 hpNow=1000/hp=2000，若错用下标会拿 order 2 的 300/1000
    expect(view[0]).toMatchObject({ id: 1, order: 0, hpAbsNow: 1000, hpMax: 2000, finWeight: 2 });
    expect(view[1]).toMatchObject({ id: 2, order: 1, hpAbsNow: 4500, hpMax: 5000 });
    expect(view[2]).toMatchObject({ id: 3, order: 2, hpAbsNow: 300, hpMax: 1000 });
  });

  it("血量三概念分别落到 hpPercent/hpAbsNow/hpMax", () => {
    const view = readView([sm({ hpRatio: 0.4 })], [st({ hp: 2000, hpNow: 800 })], {});
    expect(view[0].hpPercent).toBe(0.4); // 百分比
    expect(view[0].hpAbsNow).toBe(800); // 绝对当前
    expect(view[0].hpMax).toBe(2000); // 绝对满血
  });

  it("按 MID join：db 有九抗 → resists/powerLevel/monsterClass + monsterId/level 透传", () => {
    // st.monsterId=100 → 查 dbById[100]（不再按怪名）
    const view = readView([sm({ name: "A" })], [st({ monsterId: 100 })], { 100: fullDb() });
    expect(view[0].monsterId).toBe(100);
    expect(view[0].level).toBe(365);
    expect(view[0].powerLevel).toBe(300); // 固有 PL ≠ 战斗 level
    expect(view[0].monsterClass).toBe("Arthropod");
    expect(view[0].attackType).toBe("Piercing");
    expect(RESIST_KEYS.every((k) => k in view[0].resists)).toBe(true);
    expect(view[0].resists.holy).toBe(-50);
    expect(view[0].dbProfile).toMatchObject({ monsterClass: "Arthropod" }); // 战斗画像透传
  });

  it("MID 不匹配（同名不同怪）→ resists/powerLevel undefined（降级不崩，根治同名混库）", () => {
    // 即便怪名相同，st.monsterId=200 查不到 dbById[100] → 不误用别的怪的抗性
    const view = readView([sm({ name: "A" })], [st({ monsterId: 200 })], { 100: fullDb() });
    expect(view[0].resists).toBeUndefined();
    expect(view[0].powerLevel).toBeUndefined();
    expect(view[0].dbProfile).toBeUndefined();
  });

  it("只 maxHP 的库记录 → resists undefined 但 dbMaxHP 有（按 MID）", () => {
    const view = readView([sm()], [st({ monsterId: 300 })], {
      300: { monsterId: 300, maxHP: 900 },
    });
    expect(view[0].resists).toBeUndefined();
    expect(view[0].dbMaxHP).toBe(900);
  });

  it("monsterStatus 缺该 order → hpAbsNow/hpMax fallback、finWeight Infinity", () => {
    const view = readView([sm({ order: 0 })], [], {});
    expect(view[0].hpAbsNow).toBe(100000);
    expect(view[0].hpMax).toBe(100000);
    expect(view[0].finWeight).toBe(Infinity);
  });

  it("isBoss 身份维度透传", () => {
    const view = readView([sm({ isBoss: true })], [st()], {});
    expect(view[0].isBoss).toBe(true);
  });
});

describe("aliveByOrder", () => {
  it("按 order 升序 + 过滤死怪", () => {
    const view = [
      { order: 2, isDead: false, id: 3 },
      { order: 0, isDead: false, id: 1 },
      { order: 1, isDead: true, id: 2 },
    ];
    const result = runBattleMonsterView({ type: BattleMonsterViewEvent.READ_ALIVE_BY_ORDER, view });
    expect(result.map((m) => m.id)).toEqual([1, 3]);
  });
});

describe("monsterHpVars", () => {
  const v = (over) => ({ order: 0, isDead: false, hpPercent: 1, ...over });

  it("多怪存活 → solo 退 100；lowest/first 生效(百分比)", () => {
    const view = [
      v({ order: 0, hpPercent: 0.8 }),
      v({ order: 1, hpPercent: 0.3 }),
      v({
        order: 2,
        hpPercent: 0.5,
      }),
    ];
    expect(runBattleMonsterView({ type: BattleMonsterViewEvent.READ_HP_VARS, view })).toEqual({
      soloMonsterHpPercent: 100,
      lowestMonsterHpPercent: 30,
      firstMonsterHpPercent: 80,
    });
  });

  it("独怪 → solo = 该怪 HP%", () => {
    const result = runBattleMonsterView({
      type: BattleMonsterViewEvent.READ_HP_VARS,
      view: [v({ hpPercent: 0.2 })],
    });
    expect(result.soloMonsterHpPercent).toBe(20);
  });

  it("无存活怪 → 全 100（守卫不误伤）", () => {
    const result = runBattleMonsterView({
      type: BattleMonsterViewEvent.READ_HP_VARS,
      view: [v({ isDead: true })],
    });
    expect(result).toEqual({
      soloMonsterHpPercent: 100,
      lowestMonsterHpPercent: 100,
      firstMonsterHpPercent: 100,
    });
  });

  it("1 活 1 死 → 视为独怪(死怪被排除)", () => {
    const view = [v({ order: 0, hpPercent: 0.1 }), v({ order: 1, hpPercent: 0.9, isDead: true })];
    const result = runBattleMonsterView({ type: BattleMonsterViewEvent.READ_HP_VARS, view });
    expect(result.soloMonsterHpPercent).toBe(10);
  });
});
