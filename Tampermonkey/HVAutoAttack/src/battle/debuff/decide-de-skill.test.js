// decideDeSkill PURE 回归锁：单目标 debuff 选技能 + 选目标怪。
// 重点覆盖 Drain（Dr）目标策略——drainTargetMaxHp 开关（默认开）时打血最多的怪，
// 关时退回打首怪；其余 debuff 恒打首怪。
import { describe, it, expect } from "vitest";
import { decideDeSkill } from "./decide-de-skill.js";

/** 最小 snap 工厂（只填 decideDeSkill 读到的字段）。 */
function snap(over = {}) {
  return {
    skillReady: { "211": true, "232": true }, // Dr=211, Si=232
    spellAoe: {},
    monsters: [],
    ...over,
  };
}

/** monster 工厂：默认未死、满血、无 buff。 */
function mon(over = {}) {
  return { id: 1, order: 0, isDead: false, hpRatio: 1, buffEffects: [], ...over };
}

describe("decideDeSkill — Drain 目标策略", () => {
  it("Drain 默认（drainTargetMaxHp 缺省=开）打血最多的怪，而非首怪", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, hpRatio: 0.3 }),
        mon({ id: 2, order: 1, hpRatio: 0.9 }), // 血最多
        mon({ id: 3, order: 2, hpRatio: 0.5 }),
      ],
    });
    const opt = { debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } };
    expect(decideDeSkill(opt, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "211",
      targetSel: "#mkey_2",
    });
  });

  it("Drain hpRatio 相同时取 order 最小（稳定 first）", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, hpRatio: 0.8 }),
        mon({ id: 2, order: 1, hpRatio: 0.8 }),
      ],
    });
    const opt = { debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } };
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_1");
  });

  it("drainTargetMaxHp=false 时 Drain 退回打首怪（order 最小）", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, hpRatio: 0.3 }),
        mon({ id: 2, order: 1, hpRatio: 0.9 }),
      ],
    });
    const opt = {
      debuffSkillOrderValue: "Dr",
      debuffSkill: { Dr: true },
      drainTargetMaxHp: false,
    };
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_1");
  });

  it("Drain 选目标时跳过死怪（死怪血更多也不选）", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, hpRatio: 0.4 }),
        mon({ id: 2, order: 1, hpRatio: 1, isDead: true }), // 死怪，不计
        mon({ id: 3, order: 2, hpRatio: 0.6 }),
      ],
    });
    const opt = { debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } };
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_3");
  });

  it("非 Drain debuff（Silence）不受开关影响，恒打首怪", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, hpRatio: 0.2 }),
        mon({ id: 2, order: 1, hpRatio: 0.95 }),
      ],
    });
    const opt = { debuffSkillOrderValue: "Si", debuffSkill: { Si: true } };
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_1");
  });

  it("无存活怪 → noop", () => {
    const s = snap({ monsters: [mon({ isDead: true })] });
    const opt = { debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } };
    expect(decideDeSkill(opt, s)).toEqual({ kind: "noop" });
  });

  it("Drain AoE≥2 时以血最多怪的 order 邻居为 click 目标", () => {
    const s = snap({
      spellAoe: { Drain: 2 },
      monsters: [
        mon({ id: 1, order: 0, hpRatio: 0.3 }),
        mon({ id: 2, order: 1, hpRatio: 0.9 }), // 血最多 idx=1
        mon({ id: 3, order: 2, hpRatio: 0.5 }), // 邻居 idx=2
      ],
    });
    const opt = { debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } };
    // AoE≥2 打邻居（sortedAlive[idx+1]）→ id 3
    expect(decideDeSkill(opt, s).targetSel).toBe("#mkey_3");
  });
});
