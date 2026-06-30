import { describe, expect, it } from "vitest";
import { scorePhysicalSkillCandidates } from "./physical-skill-scoring.js";

function event(over = {}) {
  return {
    spiritOn: true,
    aliveCount: 5,
    overcharge: 300,
    skillReady: {},
    skillOTOS: {},
    conditionFacts: {},
    monsterFacts: [monster()],
    ...over,
  };
}

function monster(over = {}) {
  return {
    id: 1,
    order: 0,
    isDead: false,
    hpPercent: 1,
    buffs: [],
    ...over,
  };
}

function scoreOne(skill, opt, eventOver = {}, ctx = {}) {
  return scorePhysicalSkillCandidates(
    { skillSwitch: true, fightingStyle: "2", skillOrderValue: skill, ...opt },
    event(eventOver),
    ctx
  )[0];
}

describe("scorePhysicalSkillCandidates", () => {
  it("blocks OFC through the physical skill blocker table when downgrade applies", () => {
    expect(
      scoreOne("OFC", {}, { aliveCount: 2, skillReady: { 1111: true } })
    ).toMatchObject({
      code: "OFC",
      score: 0,
      explain: "downgrade",
    });
  });

  it("blocks T1 through the physical skill blocker table when the first monster is stunned", () => {
    expect(
      scoreOne("T1", {}, { skillReady: { 2201: true } }, { firstMonsterStunned: true })
    ).toMatchObject({
      code: "T1",
      score: 0,
      explain: "first-stunned-skip-T1",
    });
  });

  it("explains T2 combo scoring through the physical skill explainer table", () => {
    expect(
      scoreOne("T2", {}, {
        skillReady: { 2202: true },
        monsterFacts: [monster({ buffs: ["wpn_stun"] })],
      })
    ).toMatchObject({
      code: "T2",
      score: 200,
      explain: "score=200 (T1+T2 combo)",
    });
  });

  it("explains T3 execute scoring through the physical skill explainer table", () => {
    expect(
      scoreOne("T3", {}, {
        skillReady: { 2203: true },
        monsterFacts: [monster({ hpPercent: 0.1, buffs: ["wpn_bleed"] })],
      })
    ).toMatchObject({
      code: "T3",
      score: 1000,
      explain: "score=1000 (execute)",
    });
  });
});
