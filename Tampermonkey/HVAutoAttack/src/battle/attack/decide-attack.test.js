// 6B-2：decideAttack 6 分支 + fall-through 回归锁(纯决策,喂 mock snap+monsterStatus 断言 AttackPlan)。
import { describe, it, expect, beforeEach } from "vitest";
import { decideAttack } from "./decide-attack.js";
import { g } from "../../state/store.js";

/** 最小 snap 工厂(只填 decideAttack 及其纯 callee 读到的字段)。 */
function snap(over = {}) {
  return {
    spiritOn: true,
    globalTurn: 100,
    attackStatus: 0,
    channeling: false,
    aliveCount: 1,
    fightingStyle: "2",
    oc: 300,
    skillReady: {},
    spellAoe: {},
    skillOTOS: {},
    etherTapActiveX2: false,
    etherTapExpiring: false,
    monsters: [],
    ...over,
  };
}

const plan = (opt, s, m) => decideAttack(opt, s, m).plan;

beforeEach(() => {
  g("option", {});
  g("roundNow", undefined);
  g("roundAll", undefined);
  g("lastSpiritToggleGlobalTurn", undefined);
  g("skillOTOS", {});
});

describe("decideAttack 返 {kind:'attack-plan'}", () => {
  it("包一层 attack-plan", () => {
    const r = decideAttack({}, snap(), [{ id: 1, order: 0, isDead: false, hpNow: 1, hp: 1 }]);
    expect(r.kind).toBe("attack-plan");
    expect(r.plan).toBeTruthy();
  });
});

describe("decideAttack 6 分支", () => {
  it("1. focus:opt.focus + 条件满足", () => {
    expect(plan({ focus: true }, snap(), [])).toEqual({ type: "focus" });
  });

  it("2. toggle-spirit:turnOnSS 且 Spirit 未开 + 过防抖冷却", () => {
    const p = plan({ turnOnSS: true }, snap({ spiritOn: false }), []);
    expect(p).toEqual({ type: "toggle-spirit" });
  });

  it("3. spell 单目标:tier>0 + ready + aoe<2 → 打默认首怪", () => {
    const ms = [{ id: 5, order: 0, isDead: false, hpNow: 100, hp: 1000 }];
    const p = plan(
      {},
      snap({ attackStatus: 2, aliveCount: 5, skillReady: { "123": true } }),
      ms
    );
    expect(p).toEqual({ type: "spell", spellId: "123", targetId: 5 });
  });

  it("3b. spell AoE:aoe>=2 + 多怪 → 打 order 最小存活怪", () => {
    const ms = [
      { id: 3, order: 1, isDead: false, hpNow: 100, hp: 1000 },
      { id: 7, order: 0, isDead: false, hpNow: 100, hp: 1000 },
    ];
    const p = plan(
      { spellAoe: { "23": 2 } },
      snap({ attackStatus: 2, aliveCount: 5, skillReady: { "123": true } }),
      ms
    );
    expect(p).toEqual({ type: "spell", spellId: "123", targetId: 7 });
  });

  it("4. merciful-single:末回合独怪 + 流血残血 + OC 够 + 技能 ready", () => {
    g("roundNow", 2);
    g("roundAll", 2);
    const ms = [{ id: 9, order: 0, isDead: false, hpNow: 100, hp: 1000 }]; // 0.1 < 0.248
    const s = snap({
      oc: 200,
      skillReady: { "2203": true },
      monsters: [{ id: 9, order: 0, isDead: false, buffs: ["wpn_bleed"], hpRatio: 0.1 }],
    });
    const p = plan({ mercifulBlow: true, fightingStyle: "2", skillSwitch: true }, s, ms);
    expect(p).toEqual({ type: "merciful-single", skillId: "2203", targetId: 9 });
  });

  it("5. physical:utility 选中 T1 → 恒带 defaultTargetId,无 merciful", () => {
    g("roundNow", 1);
    g("roundAll", 1);
    const ms = [{ id: 1, order: 0, isDead: false, hpNow: 500, hp: 1000 }];
    const s = snap({
      attackStatus: 0,
      spiritOn: true,
      oc: 50,
      skillReady: { "2201": true },
      monsters: [{ id: 1, order: 0, isDead: false, buffs: [], hpRatio: 0.5 }],
    });
    const p = plan({ skillSwitch: true, fightingStyle: "2" }, s, ms);
    expect(p).toEqual({
      type: "physical",
      skillId: "2201",
      code: "T1",
      defaultTargetId: 1,
      mercifulTargetId: null,
    });
  });

  it("6. default:无法术(attackStatus 0)+ 无物理(skillSwitch off)→ 普攻首怪", () => {
    const ms = [{ id: 4, order: 0, isDead: false, hpNow: 100, hp: 1000 }];
    const p = plan({}, snap({ attackStatus: 0, spiritOn: false }), ms);
    expect(p).toEqual({ type: "default", targetId: 4 });
  });

  it("fall-through:法术模式但全 tier 未 ready → 落默认普攻", () => {
    const ms = [{ id: 8, order: 0, isDead: false, hpNow: 100, hp: 1000 }];
    const p = plan({}, snap({ attackStatus: 2, aliveCount: 5, skillReady: {}, spiritOn: false }), ms);
    expect(p).toEqual({ type: "default", targetId: 8 });
  });

  it("ether-tap gate:命中则跳过法术阶 → 落默认(coalescemana+无x2)", () => {
    const ms = [{ id: 2, order: 0, isDead: false, hpNow: 100, hp: 1000 }];
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { "123": true },
      spiritOn: false,
      etherTapActiveX2: false,
      monsters: [{ id: 2, order: 0, isDead: false, buffs: ["coalescemana"] }],
    });
    const p = plan({ etherTap: true, skillSwitch: false }, s, ms);
    expect(p).toEqual({ type: "default", targetId: 2 });
  });

  it("无存活怪 → noop", () => {
    expect(plan({}, snap(), [{ id: 1, order: 0, isDead: true, hpNow: 0, hp: 1 }])).toEqual({
      type: "noop",
    });
  });
});
