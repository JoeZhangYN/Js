// 6B-2：runAttackDecision 6 分支 + fall-through 回归锁(纯决策,喂 mock monsterFacts 断言 AttackPlan)。
// file-size-gate: exempt test-verbose（6 分支 + fall-through 全覆盖，逐例断言；与 decide-item.test 同类）
// 统一视图后：怪物事实全在 snap.view（finWeight/hpAbsNow/hpMax/buffs/order），不再传第三参 monsterStatus。
import { describe, it, expect } from "vitest";
import { AttackDecisionEvent, runAttackDecision } from "./decide-attack.js";
import { runAttackPlanDecision } from "./attack-plan.js";
import { runSpellAttackPlan } from "./spell-attack-plan.js";
import { runAutoElementSelection } from "./auto-element-selection.js";

/** 最小 snap 工厂(只填 runAttackDecision 及其纯 callee 读到的字段)。 */
function snap(over = {}) {
  return {
    spiritOn: true,
    globalTurn: 100,
    lastSpiritToggleGlobalTurn: undefined,
    roundAll: undefined,
    roundNow: undefined,
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
    view: [],
    ...over,
  };
}

/** UnifiedMonster 工厂：默认未死、满血、无 buff、finWeight 1。 */
function vmon(over = {}) {
  return {
    id: 1,
    order: 0,
    isDead: false,
    isBoss: false,
    finWeight: 1,
    hpAbsNow: 1000,
    hpMax: 1000,
    hpPercent: 1,
    buffs: [],
    ...over,
  };
}

const resists = (over = {}) => ({
  fire: 0,
  cold: 0,
  elec: 0,
  wind: 0,
  holy: 0,
  dark: 0,
  crushing: 0,
  slashing: 0,
  piercing: 0,
  ...over,
});

function attackFacts(snap) {
  return {
    conditionFacts: snap,
    spiritOn: snap.spiritOn,
    globalTurn: snap.globalTurn,
    lastSpiritToggleGlobalTurn: snap.lastSpiritToggleGlobalTurn,
    roundAll: snap.roundAll,
    roundNow: snap.roundNow,
    attackStatus: snap.attackStatus,
    channeling: snap.channeling,
    aliveCount: snap.aliveCount,
    fightingStyle: snap.fightingStyle,
    overcharge: snap.oc,
    skillReady: snap.skillReady,
    spellAoe: snap.spellAoe,
    skillOTOS: snap.skillOTOS,
    etherTapActiveX2: snap.etherTapActiveX2,
    etherTapExpiring: snap.etherTapExpiring,
    monsterFacts: snap.view,
  };
}

const plan = (opt, s) => runAttackDecision({ opt, ...attackFacts(s) }).plan;

describe("runAttackDecision 返 {kind:'attack-plan'}", () => {
  it("包一层 attack-plan", () => {
    const r = runAttackDecision({
      opt: {},
      ...attackFacts(snap({ view: [vmon({ id: 1, hpAbsNow: 1, hpMax: 1 })] })),
    });
    expect(r.kind).toBe("attack-plan");
    expect(r.plan).toBeTruthy();
  });

  it("rejects unknown attack decision events without choosing an attack plan", () => {
    const r = runAttackDecision({
      type: "unknown",
      opt: {},
      ...attackFacts(snap({ view: [vmon({ id: 4, order: 0 })] })),
    });

    expect(r).toEqual({
      kind: "noop",
      reason: "unknownAttackDecisionEvent",
      eventType: "unknown",
    });
  });

  it("null attack decision events use the attack-plan default path", () => {
    expect(runAttackDecision(null)).toEqual({ kind: "attack-plan", plan: { type: "noop" } });
  });

  it("rejects unknown attack plan events as noop plans", () => {
    expect(runAttackPlanDecision({ type: "unknown" })).toEqual({ type: "noop" });
    expect(runAttackPlanDecision(null)).toEqual({ type: "noop" });
  });

  it("rejects unknown spell attack plan events as empty spell plans", () => {
    expect(runSpellAttackPlan({ type: "unknown" })).toBeNull();
    expect(runSpellAttackPlan(null)).toBeNull();
  });

  it("rejects unknown auto-element events as no selected element", () => {
    expect(runAutoElementSelection({ type: "unknown" })).toEqual({ element: null });
    expect(runAutoElementSelection(null)).toEqual({ element: null });
  });
});

describe("runAttackDecision 6 分支", () => {
  it("1. focus:opt.focus + 条件满足", () => {
    expect(plan({ focus: true }, snap())).toEqual({ type: "focus" });
  });

  it("2. toggle-spirit:turnOnSS 且 Spirit 未开 + 过防抖冷却", () => {
    const p = plan({ turnOnSS: true }, snap({ spiritOn: false }));
    expect(p).toEqual({ type: "toggle-spirit" });
  });

  it("3. spell 单目标:tier>0 + ready + aoe<2 → 打默认首怪(finWeight 最小)", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 123: true },
      view: [vmon({ id: 5, order: 0, hpAbsNow: 100 })],
    });
    expect(plan({}, s)).toEqual({ type: "spell", spellId: "123", targetId: 5 });
  });

  it("3b. spell AoE:aoe>=2 + 多怪 → 打 order 最小存活怪", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 123: true },
      view: [
        vmon({ id: 3, order: 1, finWeight: 1, hpAbsNow: 100 }), // finWeight 最小=默认首怪
        vmon({ id: 7, order: 0, finWeight: 2, hpAbsNow: 100 }), // order 最小=AoE 锚
      ],
    });
    expect(plan({ spellAoe: { 23: 2 } }, s)).toEqual({
      type: "spell",
      spellId: "123",
      targetId: 7,
    });
  });

  it("4. merciful-single:末回合独怪 + 流血残血 + OC 够 + 技能 ready", () => {
    const s = snap({
      oc: 200,
      roundNow: 2,
      roundAll: 2,
      skillReady: { 2203: true },
      view: [vmon({ id: 9, order: 0, hpAbsNow: 100, hpMax: 1000, buffs: ["wpn_bleed"] })], // 0.1<0.248
    });
    expect(plan({ mercifulBlow: true, fightingStyle: "2", skillSwitch: true }, s)).toEqual({
      type: "merciful-single",
      skillId: "2203",
      targetId: 9,
    });
  });

  it("5. physical:utility 选中 T1 → 恒带 defaultTargetId,无 merciful", () => {
    const s = snap({
      attackStatus: 0,
      roundNow: 1,
      roundAll: 1,
      spiritOn: true,
      oc: 50,
      skillReady: { 2201: true },
      view: [vmon({ id: 1, order: 0, hpAbsNow: 500, hpMax: 1000, hpPercent: 0.5, buffs: [] })],
    });
    expect(plan({ skillSwitch: true, fightingStyle: "2" }, s)).toEqual({
      type: "physical",
      skillId: "2201",
      code: "T1",
      defaultTargetId: 1,
      mercifulTargetId: null,
    });
  });

  it("6. default:无法术(attackStatus 0)+ 无物理(skillSwitch off)→ 普攻首怪", () => {
    const s = snap({ attackStatus: 0, spiritOn: false, view: [vmon({ id: 4, order: 0 })] });
    expect(plan({}, s)).toEqual({ type: "default", targetId: 4 });
  });

  it("fall-through:法术模式但全 tier 未 ready → 落默认普攻", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: {},
      spiritOn: false,
      view: [vmon({ id: 8, order: 0 })],
    });
    expect(plan({}, s)).toEqual({ type: "default", targetId: 8 });
  });

  it("ether-tap gate:命中则跳过法术阶 → 落默认(coalescemana+无x2)", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 123: true },
      spiritOn: false,
      etherTapActiveX2: false,
      view: [vmon({ id: 2, order: 0, buffs: ["coalescemana"] })],
    });
    expect(plan({ etherTap: true, skillSwitch: false }, s)).toEqual({
      type: "default",
      targetId: 2,
    });
  });

  it("无存活怪 → noop", () => {
    expect(plan({}, snap({ view: [vmon({ id: 1, order: 0, isDead: true })] }))).toEqual({
      type: "noop",
    });
  });

  it("autoElement:按首怪九抗选最弱属性(holy)覆盖 attackStatus", () => {
    const s = snap({
      attackStatus: 2, // 当前 cold；autoElement 应覆盖为 holy
      aliveCount: 5,
      skillReady: { 153: true }, // holy tier3
      view: [
        vmon({
          id: 1,
          order: 0,
          resists: {
            fire: 0,
            cold: 0,
            elec: 0,
            wind: 0,
            holy: -70,
            dark: 0,
            crushing: 0,
            slashing: 0,
            piercing: 0,
          },
        }),
      ],
    });
    expect(plan({ autoElement: true }, s)).toEqual({ type: "spell", spellId: "153", targetId: 1 });
  });

  it("autoElement 开但怪未 scan(无 resists) → 回退 snap.attackStatus", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 123: true },
      view: [vmon({ id: 1, order: 0 })],
    });
    expect(plan({ autoElement: true }, s)).toEqual({ type: "spell", spellId: "123", targetId: 1 });
  });

  it("autoElementPool 限定候选：弱点 holy 不在池 → 选池内最弱 cold", () => {
    const s = snap({
      attackStatus: 1,
      aliveCount: 5,
      skillReady: { 123: true },
      view: [
        vmon({
          id: 1,
          order: 0,
          resists: resists({ holy: -50, cold: -20 }),
        }),
      ],
    });
    expect(plan({ autoElement: true, autoElementPool: ["fire", "cold", "elec"] }, s)).toEqual({
      type: "spell",
      spellId: "123",
      targetId: 1,
    });
  });

  it("autoElement 不把物理抗当成元素弱点", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 113: true },
      view: [
        vmon({
          id: 1,
          order: 0,
          resists: resists({ crushing: -99 }),
        }),
      ],
    });
    expect(plan({ autoElement: true }, s)).toEqual({ type: "spell", spellId: "113", targetId: 1 });
  });
});

describe("runAttackDecision 法术 tier 入口契约", () => {
  it("少怪降级(aliveCount<=阈值) → 仅 tier1", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 2,
      skillReady: { 121: true, 122: true, 123: true },
      view: [vmon({ id: 1 })],
    });
    expect(plan({}, s)).toEqual({ type: "spell", spellId: "121", targetId: 1 });
  });

  it("多怪 + 高阶 ready + 条件满足 → tier3", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 121: true, 122: true, 123: true },
      view: [vmon({ id: 1 })],
    });
    expect(plan({}, s)).toEqual({ type: "spell", spellId: "123", targetId: 1 });
  });

  it("多怪 + 仅中阶 ready → tier2", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      skillReady: { 121: true, 122: true },
      view: [vmon({ id: 1 })],
    });
    expect(plan({}, s)).toEqual({ type: "spell", spellId: "122", targetId: 1 });
  });
});

describe("runAttackDecision 物理技能评分入口契约", () => {
  it("少怪降级时不选 OFC/FRD，落到可用 T1", () => {
    const s = snap({
      attackStatus: 0,
      aliveCount: 2,
      oc: 300,
      skillReady: { 1111: true, 1101: true, 2201: true },
      view: [vmon({ id: 1, hpPercent: 0.8 })],
    });
    expect(plan({ skillSwitch: true, fightingStyle: "2" }, s)).toEqual({
      type: "physical",
      skillId: "2201",
      code: "T1",
      defaultTargetId: 1,
      mercifulTargetId: null,
    });
  });

  it("首怪已 stun 时 T2 combo 优先，且不浪费 T1", () => {
    const s = snap({
      attackStatus: 0,
      aliveCount: 5,
      oc: 100,
      skillReady: { 2201: true, 2202: true },
      view: [vmon({ id: 1, hpPercent: 0.8, buffs: ["wpn_stun"] })],
    });
    expect(plan({ skillSwitch: true, fightingStyle: "2" }, s)).toEqual({
      type: "physical",
      skillId: "2202",
      code: "T2",
      defaultTargetId: 1,
      mercifulTargetId: null,
    });
  });
});

describe("runAttackDecision 清场大招查询入口契约", () => {
  it("复用攻击计划判断 OFC/FRD 是否会在攻击阶段开火", () => {
    const s = snap({
      attackStatus: 0,
      aliveCount: 5,
      oc: 250,
      skillReady: { 1111: true },
      view: [vmon({ id: 1, hpPercent: 0.8 })],
    });
    expect(
      runAttackDecision({
        type: AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL,
        opt: { skillSwitch: true, skill_OFC: true },
        ...attackFacts(s),
      })
    ).toBe(true);
  });

  it("资源够但攻击入口会先走法术时，不把 OFC 视为本攻击阶段清场", () => {
    const s = snap({
      attackStatus: 2,
      aliveCount: 5,
      oc: 250,
      skillReady: { 1111: true, 123: true },
      view: [vmon({ id: 1, hpPercent: 0.8 })],
    });
    expect(
      runAttackDecision({
        type: AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL,
        opt: { skillSwitch: true, skill_OFC: true },
        ...attackFacts(s),
      })
    ).toBe(false);
  });
});
