// decideDeSkill PURE 回归锁：单目标 debuff 选技能 + 选目标怪（从统一视图 snap.view 派生）。
// 重点覆盖 Drain（Dr）目标策略——drainTargetMaxHp 开关（默认开）时打**绝对血最多**的怪(hpAbsNow)，
// 恒点该怪本身(取消邻居偏移)；关时退回打首怪；其余 debuff 恒打首怪。
import { describe, it, expect } from "vitest";
import { decideDeSkill } from "./decide-de-skill.js";

/** 最小 snap 工厂（只填 decideDeSkill 读到的字段；怪物走统一视图 view）。 */
function snap(over = {}) {
  return {
    skillReady: { 211: true, 232: true }, // Dr=211, Si=232
    spellAoe: {},
    view: [],
    ...over,
  };
}

/** UnifiedMonster 工厂：默认未死、绝对血 1000、无 buff。 */
function mon(over = {}) {
  return {
    id: 1,
    order: 0,
    isDead: false,
    isBoss: false,
    hpAbsNow: 1000,
    hpPercent: 1,
    buffEffects: [],
    ...over,
  };
}

const enabled = (over = {}) => ({
  debuffSkillSwitch: true,
  debuffSkill: {},
  ...over,
});

describe("decideDeSkill — entry gate", () => {
  it("debuffSkillSwitch 未开 -> noop", () => {
    const s = snap({ view: [mon()] });
    expect(decideDeSkill({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } }, s)).toEqual({
      kind: "noop",
    });
  });

  it("debuffSkillCondition 不满足 -> noop", () => {
    const s = snap({ hp: 0.9, view: [mon()] });
    expect(
      decideDeSkill(
        enabled({
          debuffSkillOrderValue: "Dr",
          debuffSkill: { Dr: true },
          debuffSkillCondition: [["hp,2,0.5"]],
        }),
        s
      )
    ).toEqual({ kind: "noop" });
  });

  it("stall active -> noop", () => {
    const s = snap({
      oc: 100,
      roundNow: 1,
      roundAll: 2,
      view: [mon({ hpPercent: 0.8 })],
    });
    expect(
      decideDeSkill(enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } }), s)
    ).toEqual({ kind: "noop" });
  });
});

describe("decideDeSkill — Drain 目标策略", () => {
  it("Drain 默认（drainTargetMaxHp 缺省=开）打绝对血最多的怪，而非首怪", () => {
    const s = snap({
      view: [
        mon({ id: 1, order: 0, hpAbsNow: 300 }),
        mon({ id: 2, order: 1, hpAbsNow: 900 }), // 绝对血最多
        mon({ id: 3, order: 2, hpAbsNow: 500 }),
      ],
    });
    const opt = enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } });
    expect(decideDeSkill(opt, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "211",
      targetSel: "#mkey_2",
    });
  });

  it("根因回归：满血小怪 hpPercent 高但 hpAbsNow 低 → Drain 仍选 hpAbsNow 高的 boss", () => {
    const s = snap({
      view: [
        mon({ id: 1, order: 0, hpPercent: 1.0, hpAbsNow: 800 }), // 满血小怪（旧 hpRatio 口径会误选它）
        mon({ id: 2, order: 1, isBoss: true, hpPercent: 0.6, hpAbsNow: 30000 }), // 被打过的 boss
      ],
    });
    const opt = enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } });
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_2");
  });

  it("Drain hpAbsNow 相同时取 order 最小（稳定 first）", () => {
    const s = snap({
      view: [mon({ id: 1, order: 0, hpAbsNow: 800 }), mon({ id: 2, order: 1, hpAbsNow: 800 })],
    });
    const opt = enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } });
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_1");
  });

  it("drainTargetMaxHp=false 时 Drain 退回打首怪（order 最小）", () => {
    const s = snap({
      view: [mon({ id: 1, order: 0, hpAbsNow: 300 }), mon({ id: 2, order: 1, hpAbsNow: 900 })],
    });
    const opt = enabled({
      debuffSkillOrderValue: "Dr",
      debuffSkill: { Dr: true },
      drainTargetMaxHp: false,
    });
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_1");
  });

  it("Drain 选目标时跳过死怪（死怪血更多也不选）", () => {
    const s = snap({
      view: [
        mon({ id: 1, order: 0, hpAbsNow: 400 }),
        mon({ id: 2, order: 1, hpAbsNow: 9999, isDead: true }), // 死怪，不计
        mon({ id: 3, order: 2, hpAbsNow: 600 }),
      ],
    });
    const opt = enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } });
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_3");
  });

  it("Drain AoE≥2 时仍恒点血最多怪本身（取消邻居偏移，修复目标漂移）", () => {
    const s = snap({
      spellAoe: { Drain: 2 },
      view: [
        mon({ id: 1, order: 0, hpAbsNow: 300 }),
        mon({ id: 2, order: 1, hpAbsNow: 900 }), // 绝对血最多
        mon({ id: 3, order: 2, hpAbsNow: 500 }),
      ],
    });
    const opt = enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } });
    // 旧行为会漂移到 order 邻居 #mkey_3；新行为 selfTarget → 恒打血最多怪 #mkey_2
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_2");
  });

  it("非 Drain debuff（Silence）不受开关影响，恒打首怪", () => {
    const s = snap({
      view: [mon({ id: 1, order: 0, hpAbsNow: 200 }), mon({ id: 2, order: 1, hpAbsNow: 9500 })],
    });
    const opt = enabled({ debuffSkillOrderValue: "Si", debuffSkill: { Si: true } });
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_1");
  });

  it("非 Drain debuff AoE≥2 → 保留邻居覆盖优化(首怪邻居)", () => {
    const s = snap({
      spellAoe: { Silence: 2 },
      view: [mon({ id: 1, order: 0, hpAbsNow: 200 }), mon({ id: 2, order: 1, hpAbsNow: 900 })],
    });
    const opt = enabled({ debuffSkillOrderValue: "Si", debuffSkill: { Si: true } });
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_2"); // 首怪(id1) 的邻居 id2
  });

  it("无存活怪 → noop", () => {
    const s = snap({ view: [mon({ isDead: true })] });
    const opt = enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } });
    expect(decideDeSkill(opt, s)).toEqual({ kind: "noop" });
  });
});
