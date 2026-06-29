// BATTLE_RULES 结构 + 关键 rule 的 decide 回归锁。
// file-size-gate: exempt test-verbose（17 条顺序锁 + F1/F4/F5 多守卫逐例断言）
// 深度 B 后全部 decide 均为 PURE（无 delegate）；此处验证结构 / 自包含 decide 形状。
import { describe, it, expect } from "vitest";
import { BATTLE_RULES } from "./index.js";

const byName = (name) => BATTLE_RULES.find((r) => r.name === name);

describe("BATTLE_RULES 结构", () => {
  it("17 条，顺序与原 runSteps 一致（F5 burstControl 插在 useBuffSkill 与 bossImperil 之间）", () => {
    expect(BATTLE_RULES.map((r) => r.name)).toEqual([
      "criticalBuffGuard",
      "flee",
      "autoPause",
      "useGem",
      "deadSoon",
      "stallTopup",
      "defend",
      "useScroll",
      "useInfusions",
      "useChannelSkill",
      "useBuffSkill",
      "burstControl",
      "bossImperil",
      "castWeakenAll",
      "castImperilAll",
      "useDeSkill",
      "attack",
    ]);
  });

  it("每条 rule 有 name + decide 函数", () => {
    for (const r of BATTLE_RULES) {
      expect(typeof r.name).toBe("string");
      expect(typeof r.decide).toBe("function");
      expect(r).not.toHaveProperty("when");
    }
  });
});

describe("干净 rule 的 decide 返真 ActionResult", () => {
  it("flee → noop when disabled", () => {
    expect(byName("flee").decide({}, {})).toEqual({ kind: "noop" });
  });

  it("defend → noop when disabled", () => {
    expect(byName("defend").decide({}, {})).toEqual({ kind: "noop" });
  });
});

describe("PURE decide 形状（深度 B 后无 delegate）", () => {
  it("criticalBuffGuard → noop（未开 pauseOnCriticalBuffExpire）", () => {
    expect(byName("criticalBuffGuard").decide({}, {})).toEqual({ kind: "noop" });
  });

  it("autoPause → noop when disabled", () => {
    expect(byName("autoPause").decide({}, {})).toEqual({ kind: "noop" });
  });

  it("attack → attack-plan（PURE，非 delegate）", () => {
    const r = byName("attack").decide({}, {});
    expect(r.kind).toBe("attack-plan");
    expect(r.plan).toBeTruthy();
  });

  it("没有 rule 返 delegate（过渡桥已删）", () => {
    const kinds = BATTLE_RULES.map((r) => {
      try {
        return r.decide({ monsters: [], skillReady: {}, playerEffects: [] }, {})?.kind;
      } catch {
        return null;
      }
    });
    expect(kinds).not.toContain("delegate");
  });
});

describe("rule decide 门控", () => {
  it("flee: 规则表不拼门控，开启时由 decide 返回 flee-command", () => {
    expect(byName("flee").decide({}, { autoFlee: true })).toEqual({
      kind: "flee-command",
    });
  });

  it("autoPause: 规则表不拼门控，开启时由 decide 返回 pause", () => {
    expect(byName("autoPause").decide({}, { autoPause: true })).toEqual({ kind: "pause" });
  });

  it("defend: 规则表不拼门控，开启时由 decide 返回 defend-command", () => {
    expect(byName("defend").decide({}, { defend: true })).toEqual({
      kind: "defend-command",
    });
  });

  it("deadSoon: 规则表不拼门控，未配置时 decide 自行返回空 potion plan", () => {
    expect(byName("deadSoon").decide({}, {})).toEqual({
      kind: "item-plan",
      plan: { type: "potion", candidates: [], noWaste: false },
    });
  });

  it("useInfusions: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useInfusions").decide({ attackStatus: 2, playerBuffs: [] }, {})).toEqual({
      kind: "noop",
    });
  });

  it("useChannelSkill: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useChannelSkill").decide({ channeling: true }, {})).toEqual({
      kind: "channel-plan",
      plan: { type: "noop" },
    });
  });

  it("useBuffSkill: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useBuffSkill").decide({}, {})).toEqual({ kind: "noop" });
  });

  it("useDeSkill: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useDeSkill").decide({ view: [] }, {})).toEqual({ kind: "noop" });
  });

  it("bossImperil: 规则表不拼 CAN_CAST 门控，未 ready 时 decide 自行 noop", () => {
    expect(byName("bossImperil").decide({ skillReady: { 213: false }, view: [] }, {})).toEqual({
      kind: "noop",
    });
  });
});

// Feature 1 回归锁：拖战入口判定为 active 时 Imperil 两路(bossImperil/castImperilAll)被守卫跳过，
// Weaken 不被跳（减伤助生存）。骑 master stallMode 开关，无独立子开关。
describe("Feature 1: 拖战跳 Imperil", () => {
  // stall active：stallMode!==false + roundNow<roundAll + 恰 1 活怪 + hpPercent>=0.3 + oc<250
  const stallSnap = (over = {}) => ({
    skillReady: { 213: true },
    oc: 100,
    monsterAlive: 1,
    roundAll: 3,
    roundNow: 1,
    view: [{ id: 1, order: 0, isDead: false, isBoss: true, hpPercent: 0.6, buffs: [] }],
    monsters: [{ id: 1, order: 0, isDead: false, isBoss: true }],
    ...over,
  });
  it("stall 中 bossImperil decide → noop（不再 imperil 独怪）", () => {
    expect(byName("bossImperil").decide(stallSnap(), { stallMode: true })).toEqual({
      kind: "noop",
    });
  });

  it("stallMode:false → bossImperil decide 恢复（由业务入口决定是否命中）", () => {
    expect(byName("bossImperil").decide(stallSnap(), { stallMode: false })).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("非 stall（roundNow 未设）→ bossImperil decide 不受影响", () => {
    expect(
      byName("bossImperil").decide(
        {
          skillReady: { 213: true },
          view: [{ id: 1, order: 0, isDead: false, isBoss: true, buffs: [] }],
        },
        {}
      )
    ).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("stall 中 castImperilAll 由 decide 自行跳过", () => {
    expect(
      byName("castImperilAll").decide(stallSnap(), {
        stallMode: true,
        debuffSkillSwitch: true,
        debuffSkillAllIm: true,
      })
    ).toEqual({ kind: "noop" });
  });

  it("stall 中 castWeakenAll 规则表不拼门控", () => {
    expect(byName("castWeakenAll").decide(stallSnap(), {})).toEqual({ kind: "noop" });
  });
});

describe("F5: burstControl 入口门控", () => {
  it("规则表不拼开关门控；未开启时 decide 自行返回 noop", () => {
    expect(byName("burstControl").decide({}, {})).toEqual({ kind: "noop" });
  });
});
