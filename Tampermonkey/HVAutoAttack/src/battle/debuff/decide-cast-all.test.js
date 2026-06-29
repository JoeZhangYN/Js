import { describe, expect, it } from "vitest";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";

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

describe("decideCastDebuffOnAll", () => {
  it("requires global debuff switch", () => {
    expect(decideCastDebuffOnAll({ debuffSkillAllWk: true }, snap(), "We")).toEqual({
      kind: "noop",
    });
  });

  it("requires kind-specific all switch", () => {
    expect(decideCastDebuffOnAll({ debuffSkillSwitch: true }, snap(), "We")).toEqual({
      kind: "noop",
    });
  });

  it("requires kind-specific condition", () => {
    expect(
      decideCastDebuffOnAll(
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
      decideCastDebuffOnAll(
        { debuffSkillSwitch: true, debuffSkillAllWk: true },
        snap({ view: [{ ...snap().view[0], buffs: ["weaken"] }] }),
        "We"
      )
    ).toEqual({ kind: "noop" });
  });

  it("casts Weaken when all gate facts allow it", () => {
    expect(
      decideCastDebuffOnAll({ debuffSkillSwitch: true, debuffSkillAllWk: true }, snap(), "We")
    ).toEqual({
      kind: "click-skill-then-target",
      skillSel: "212",
      targetSel: "#mkey_1",
    });
  });

  it("skips Weaken when clear skill is ready", () => {
    expect(
      decideCastDebuffOnAll(
        {
          debuffSkillSwitch: true,
          debuffSkillAllWk: true,
          skill_OFC: true,
        },
        snap({ cdMap: { OFC: 0 }, oc: 205 }),
        "We"
      )
    ).toEqual({ kind: "noop" });
  });

  it("skips Imperil during stall", () => {
    expect(
      decideCastDebuffOnAll(
        { debuffSkillSwitch: true, debuffSkillAllIm: true, stallMode: true },
        snap({ roundNow: 1, roundAll: 2, oc: 100 }),
        "Im"
      )
    ).toEqual({ kind: "noop" });
  });

  it("does not skip Weaken only because stall is active", () => {
    expect(
      decideCastDebuffOnAll(
        {
          debuffSkillSwitch: true,
          debuffSkillAllWk: true,
          stallMode: true,
        },
        snap({ roundNow: 1, roundAll: 2, oc: 100 }),
        "We"
      )
    ).toEqual({
      kind: "click-skill-then-target",
      skillSel: "212",
      targetSel: "#mkey_1",
    });
  });

  it("casts Imperil when all gate facts allow it", () => {
    expect(
      decideCastDebuffOnAll({ debuffSkillSwitch: true, debuffSkillAllIm: true }, snap(), "Im")
    ).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_1",
    });
  });
});
