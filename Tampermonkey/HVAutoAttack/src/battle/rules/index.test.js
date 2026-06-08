// Commit 4：BATTLE_RULES 结构 + 关键 rule 的 when/decide 回归锁。
// 只验证「纯」部分（结构 / 自包含的 flee·defend decide / when 门控）；delegate rule 的 decide
// 只构造 {kind:"delegate", run} 不调用 run（调 run 才有副作用），故可安全断言其形状。
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

describe("delegate rule 的 decide 形状（不调 run）", () => {
  it("criticalBuffGuard → delegate", () => {
    const r = byName("criticalBuffGuard").decide({}, {});
    expect(r.kind).toBe("delegate");
    expect(r.name).toBe("criticalBuffGuard");
    expect(typeof r.run).toBe("function");
  });

  it("attack → attack-plan(深度 B 已 PURE 化,非 delegate)", () => {
    const r = byName("attack").decide({}, {});
    expect(r.kind).toBe("attack-plan");
    expect(r.plan).toBeTruthy();
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
