// BATTLE_RULES 结构 + 关键 rule 的 when/decide 回归锁。
// 深度 B 后全部 16 条 decide 均为 PURE（无 delegate）；此处验证结构 / 自包含 decide 形状 / when 门控。
import { describe, it, expect } from "vitest";
import { BATTLE_RULES } from "./index.js";

const byName = (name) => BATTLE_RULES.find((r) => r.name === name);

describe("BATTLE_RULES 结构", () => {
  it("16 条，顺序与原 runSteps 一致", () => {
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

  it("defend → click #ckey_defend", () => {
    expect(byName("defend").decide({}, {})).toEqual({
      kind: "click",
      selector: "#ckey_defend",
    });
  });
});

describe("PURE decide 形状（深度 B 后无 delegate）", () => {
  it("criticalBuffGuard → noop（未开 pauseOnCriticalBuffExpire）", () => {
    expect(byName("criticalBuffGuard").decide({}, {})).toEqual({ kind: "noop" });
  });

  it("autoPause → pause", () => {
    expect(byName("autoPause").decide({}, {})).toEqual({ kind: "pause" });
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

  it("defend.when: 需 opt.defend", () => {
    expect(byName("defend").when({}, { defend: true })).toBe(true);
    expect(byName("defend").when({}, {})).toBeFalsy();
  });

  it("useInfusions.when: 需 attackStatus!=0 + infusionSwitch", () => {
    expect(byName("useInfusions").when({ attackStatus: 2 }, { infusionSwitch: true })).toBe(true);
    expect(byName("useInfusions").when({ attackStatus: 0 }, { infusionSwitch: true })).toBe(false);
  });

  it("bossImperil.when: 需 skillReady[213] 且 debuffSkillSwitch!==false", () => {
    expect(byName("bossImperil").when({ skillReady: { "213": true } }, {})).toBe(true);
    expect(byName("bossImperil").when({ skillReady: { "213": false } }, {})).toBe(false);
    expect(
      byName("bossImperil").when({ skillReady: { "213": true } }, { debuffSkillSwitch: false })
    ).toBe(false);
  });
});
