// BATTLE_RULES 结构 + 关键 rule 的 when/decide 回归锁。
// file-size-gate: exempt test-verbose（17 条顺序锁 + F1/F4/F5 多 when 守卫逐例断言）
// 深度 B 后全部 decide 均为 PURE（无 delegate）；此处验证结构 / 自包含 decide 形状 / when 门控。
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
      if (r.when !== undefined) expect(typeof r.when).toBe("function");
    }
  });
});

describe("干净 rule 的 decide 返真 ActionResult", () => {
  it("flee → click-then-reload(1001, 3s)", () => {
    expect(byName("flee").decide({}, {})).toEqual({
      kind: "click-then-reload",
      selector: "1001",
      delaySec: 3,
    });
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

describe("when 门控", () => {
  it("flee.when: autoFlee 且 fleeCondition 满足(undefined→true)", () => {
    expect(byName("flee").when({}, { autoFlee: true })).toBe(true);
    expect(byName("flee").when({}, { autoFlee: false })).toBeFalsy();
  });

  it("autoPause: 规则表不拼门控，开启时由 decide 返回 pause", () => {
    expect(byName("autoPause").when).toBeUndefined();
    expect(byName("autoPause").decide({}, { autoPause: true })).toEqual({ kind: "pause" });
  });

  it("defend: 规则表不拼门控，开启时由 decide 返回 click", () => {
    expect(byName("defend").when).toBeUndefined();
    expect(byName("defend").decide({}, { defend: true })).toEqual({
      kind: "click",
      selector: "#ckey_defend",
    });
  });

  it("deadSoon: 规则表不拼门控，未配置时 decide 自行返回空 potion plan", () => {
    expect(byName("deadSoon").when).toBeUndefined();
    expect(byName("deadSoon").decide({}, {})).toEqual({
      kind: "item-plan",
      plan: { type: "potion", candidates: [], noWaste: false },
    });
  });

  it("useInfusions: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useInfusions").when).toBeUndefined();
    expect(byName("useInfusions").decide({ attackStatus: 2, playerBuffs: [] }, {})).toEqual({
      kind: "noop",
    });
  });

  it("useChannelSkill: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useChannelSkill").when).toBeUndefined();
    expect(byName("useChannelSkill").decide({ channeling: true }, {})).toEqual({
      kind: "channel-plan",
      plan: { type: "noop" },
    });
  });

  it("useBuffSkill: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useBuffSkill").when).toBeUndefined();
    expect(byName("useBuffSkill").decide({}, {})).toEqual({ kind: "noop" });
  });

  it("useDeSkill: 规则表不拼门控，未开启时 decide 自行 noop", () => {
    expect(byName("useDeSkill").when).toBeUndefined();
    expect(byName("useDeSkill").decide({ view: [] }, {})).toEqual({ kind: "noop" });
  });

  it("bossImperil.when: 需 skillReady[213] 且 debuffSkillSwitch!==false", () => {
    expect(byName("bossImperil").when({ skillReady: { 213: true } }, {})).toBe(true);
    expect(byName("bossImperil").when({ skillReady: { 213: false } }, {})).toBe(false);
    expect(
      byName("bossImperil").when({ skillReady: { 213: true } }, { debuffSkillSwitch: false })
    ).toBe(false);
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
  it("stall 中 bossImperil.when → false（不再 imperil 独怪）", () => {
    expect(byName("bossImperil").when(stallSnap(), { stallMode: true })).toBeFalsy();
  });

  it("stallMode:false → bossImperil.when 恢复（由 skillReady 决定）", () => {
    expect(byName("bossImperil").when(stallSnap(), { stallMode: false })).toBe(true);
  });

  it("非 stall（roundNow 未设）→ bossImperil.when 不受影响", () => {
    expect(byName("bossImperil").when({ skillReady: { 213: true } }, {})).toBe(true);
  });

  it("stall 中 castImperilAll 由 decide 自行跳过", () => {
    expect(byName("castImperilAll").when).toBeUndefined();
    expect(
      byName("castImperilAll").decide(stallSnap(), {
        stallMode: true,
        debuffSkillSwitch: true,
        debuffSkillAllIm: true,
      })
    ).toEqual({ kind: "noop" });
  });

  it("stall 中 castWeakenAll 规则表不拼门控", () => {
    expect(byName("castWeakenAll").when).toBeUndefined();
    expect(byName("castWeakenAll").decide(stallSnap(), {})).toEqual({ kind: "noop" });
  });
});

describe("F5: burstControl 入口门控", () => {
  it("规则表不拼开关门控；未开启时 decide 自行返回 noop", () => {
    expect(byName("burstControl").when).toBeUndefined();
    expect(byName("burstControl").decide({}, {})).toEqual({ kind: "noop" });
  });
});
