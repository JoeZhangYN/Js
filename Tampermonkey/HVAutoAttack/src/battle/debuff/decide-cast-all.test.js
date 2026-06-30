import { describe, expect, it } from "vitest";
import { BattleAllDebuffDecisionEvent, runBattleAllDebuffDecision } from "./decide-cast-all.js";

function snap(over = {}) {
  return {
    monsterAlive: 1,
    skillReady: { 212: true, 213: true },
    spellAoe: {},
    view: [
      {
        id: 1,
        order: 0,
        isDead: false,
        isBoss: false,
        hpPercent: 0.8,
        buffs: [],
        buffEffects: [],
      },
    ],
    cdMap: {},
    aliveCount: 1,
    oc: 0,
    ...over,
  };
}

function allDebuffFacts(snap) {
  return {
    conditionFacts: snap,
    monsterAlive: snap.monsterAlive,
    skillReady: snap.skillReady,
    spellAoe: snap.spellAoe,
    skillCooldowns: snap.cdMap,
    aliveCount: snap.aliveCount,
    overcharge: snap.oc,
    roundNow: snap.roundNow,
    roundAll: snap.roundAll,
    monsterFacts: snap.view,
    skipWeakenForBigSkill: snap.skipWeakenForBigSkill,
    skipImperilForBigSkill: snap.skipImperilForBigSkill,
    stallActive: snap.stallActive,
  };
}

function decide(opt, s, debuffKey) {
  return runBattleAllDebuffDecision({
    type: BattleAllDebuffDecisionEvent.DECIDE,
    opt,
    debuffKey,
    ...allDebuffFacts(s),
  });
}

describe("decideCastDebuffOnAll", () => {
  it("requires global debuff switch", () => {
    expect(decide({ debuffSkillAllWk: true }, snap(), "We")).toEqual({
      kind: "noop",
    });
  });

  it("requires kind-specific all switch", () => {
    expect(decide({ debuffSkillSwitch: true }, snap(), "We")).toEqual({
      kind: "noop",
    });
  });

  it("requires kind-specific condition", () => {
    expect(
      decide(
        {
          debuffSkillSwitch: true,
          debuffSkillAllWk: true,
          debuffSkillWkCondition: [["hp,2,0.5"]],
        },
        snap({ hp: 0.9 }),
        "We"
      )
    ).toEqual({ kind: "noop" });
  });

  it("requires missing debuff coverage", () => {
    expect(
      decide(
        { debuffSkillSwitch: true, debuffSkillAllWk: true },
        snap({ view: [{ ...snap().view[0], buffs: ["weaken"] }] }),
        "We"
      )
    ).toEqual({ kind: "noop" });
  });

  it("casts Weaken when all gate facts allow it", () => {
    expect(decide({ debuffSkillSwitch: true, debuffSkillAllWk: true }, snap(), "We")).toEqual({
      kind: "click-skill-then-target",
      skillId: "212",
      targetId: 1,
    });
  });

  it("skips Weaken when clear skill is ready", () => {
    expect(
      decide(
        {
          debuffSkillSwitch: true,
          debuffSkillAllWk: true,
        },
        snap({ skipWeakenForBigSkill: true }),
        "We"
      )
    ).toEqual({ kind: "noop" });
  });

  it("skips Imperil during stall", () => {
    expect(
      decide({ debuffSkillSwitch: true, debuffSkillAllIm: true }, snap({ stallActive: true }), "Im")
    ).toEqual({ kind: "noop" });
  });

  it("does not skip Weaken only because stall is active", () => {
    expect(
      decide(
        {
          debuffSkillSwitch: true,
          debuffSkillAllWk: true,
        },
        snap({ stallActive: true }),
        "We"
      )
    ).toEqual({
      kind: "click-skill-then-target",
      skillId: "212",
      targetId: 1,
    });
  });

  it("casts Imperil when all gate facts allow it", () => {
    expect(decide({ debuffSkillSwitch: true, debuffSkillAllIm: true }, snap(), "Im")).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("rejects unknown all-debuff decision events", () => {
    expect(runBattleAllDebuffDecision({ type: "unknown" })).toEqual({ kind: "noop" });
  });
});
