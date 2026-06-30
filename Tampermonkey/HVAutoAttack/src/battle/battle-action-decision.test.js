import { describe, expect, it, vi } from "vitest";
import { runBattleActionDecision } from "./battle-action-decision.js";

const mocks = vi.hoisted(() => ({
  runRules: vi.fn(),
}));

vi.mock("./step-runner.js", () => ({ runRules: mocks.runRules }));

function actionRules(snap = {}, opt = {}) {
  mocks.runRules.mockClear();
  runBattleActionDecision(snap, opt);
  return mocks.runRules.mock.calls.at(-1)[0];
}

const byName = (name, snap = {}, opt = {}) => actionRules(snap, opt).find((r) => r.name === name);

describe("runBattleActionDecision", () => {
  it("owns the battle rule order and runner protocol", () => {
    const snap = { hp: 70 };
    const battleRuleOptions = { autoFlee: false };

    runBattleActionDecision(snap, battleRuleOptions);

    const rules = mocks.runRules.mock.calls.at(-1)[0];
    expect(rules.map((r) => r.name)).toEqual([
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
    expect(mocks.runRules).toHaveBeenCalledWith(rules, snap, battleRuleOptions);
  });

  it("rules expose name + decide only; no legacy when gate", () => {
    for (const rule of actionRules()) {
      expect(typeof rule.name).toBe("string");
      expect(typeof rule.decide).toBe("function");
      expect(rule).not.toHaveProperty("when");
    }
  });
});

describe("runBattleActionDecision rule contracts", () => {
  it("clean rule decisions return ActionResult, not delegate", () => {
    expect(byName("flee").decide({}, {})).toEqual({ kind: "noop" });
    expect(byName("defend").decide({}, {})).toEqual({ kind: "noop" });
    expect(byName("criticalBuffGuard").decide({}, {})).toEqual({ kind: "noop" });
    expect(byName("autoPause").decide({}, {})).toEqual({ kind: "noop" });
    const attack = byName("attack").decide({}, {});
    expect(attack.kind).toBe("attack-plan");
    expect(attack.plan).toBeTruthy();

    const kinds = actionRules().map((rule) => {
      try {
        return rule.decide({ monsters: [], skillReady: {}, playerEffects: [] }, {})?.kind;
      } catch {
        return null;
      }
    });
    expect(kinds).not.toContain("delegate");
  });

  it("rule table does not assemble basic gates; rule entries decide their own noops/actions", () => {
    expect(byName("flee").decide({}, { autoFlee: true })).toEqual({ kind: "flee-command" });
    expect(byName("autoPause").decide({}, { autoPause: true })).toEqual({ kind: "pause" });
    expect(byName("defend").decide({}, { defend: true })).toEqual({ kind: "defend-command" });
    expect(byName("deadSoon").decide({}, {})).toEqual({
      kind: "item-plan",
      plan: { type: "potion", candidates: [], noWaste: false },
    });
    expect(byName("useInfusions").decide({ attackStatus: 2, playerBuffs: [] }, {})).toEqual({
      kind: "noop",
    });
    expect(byName("useChannelSkill").decide({ channeling: true }, {})).toEqual({
      kind: "channel-plan",
      plan: { type: "noop" },
    });
    expect(byName("useBuffSkill").decide({}, {})).toEqual({ kind: "noop" });
    expect(byName("useDeSkill").decide({ view: [] }, {})).toEqual({ kind: "noop" });
    expect(byName("bossImperil").decide({ skillReady: { 213: false }, view: [] }, {})).toEqual({
      kind: "noop",
    });
  });
});

describe("runBattleActionDecision stall Imperil contract", () => {
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

  it("stall 中 bossImperil decide → noop", () => {
    expect(byName("bossImperil").decide(stallSnap(), { stallMode: true })).toEqual({
      kind: "noop",
    });
  });

  it("stallMode:false → bossImperil decide 恢复", () => {
    expect(byName("bossImperil").decide(stallSnap(), { stallMode: false })).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("非 stall → bossImperil decide 不受影响", () => {
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

  it("burstControl 未开启时入口自行返回 noop", () => {
    expect(byName("burstControl").decide({}, {})).toEqual({ kind: "noop" });
  });
});
