import { describe, expect, it } from "vitest";
import {
  buildUtilityShadowProposal,
  evaluateUtilityCandidate,
} from "./utility-weight-evaluation.js";
import { createUtilitySkillSamples, DEFAULT_UTILITY_MULTIPLIERS } from "./utility-weight-model.js";

function battle(over = {}) {
  return {
    oc: 100,
    progress: 10,
    potions: 1,
    turns: 10,
    flee: 0,
    pause: 0,
    recovery: 0,
    outcome: "victory",
    ...over,
  };
}

describe("utility weight shadow and rollback evaluation", () => {
  it("requires 20 samples per skill and limits each proposal step to 0.05", () => {
    const samples = createUtilitySkillSamples();
    for (const [code, mean] of Object.entries({ OFC: 2, FRD: 1, T3: 0.5, T2: 0.5, T1: 0.5 })) {
      samples[code] = { count: 20, efficiencySum: mean * 20 };
    }

    expect(buildUtilityShadowProposal(samples, DEFAULT_UTILITY_MULTIPLIERS)).toMatchObject({
      ready: true,
      changed: true,
      multipliers: { OFC: 1.05, FRD: 1.05, T3: 0.95, T2: 0.95, T1: 0.95 },
    });
    samples.T1.count = 19;
    expect(buildUtilityShadowProposal(samples, DEFAULT_UTILITY_MULTIPLIERS)).toEqual({
      ready: false,
    });
  });

  it("rolls back on resource, safety, or turn regression", () => {
    const baseline = Array.from({ length: 20 }, () => battle());
    const candidate = Array.from({ length: 20 }, () =>
      battle({ oc: 111, potions: 1.11, turns: 12.1, recovery: 1 })
    );

    expect(evaluateUtilityCandidate(baseline, candidate)).toMatchObject({
      rollback: true,
      reasons: expect.arrayContaining([
        "ocPerProgressWorseThan10Percent",
        "potionsPerBattleWorseThan10Percent",
        "turnsPerBattleWorseThan20Percent",
        "recoveryIncreased",
      ]),
    });
  });

  it("accepts a candidate when resource and safety metrics do not regress", () => {
    const baseline = Array.from({ length: 20 }, () => battle());
    const candidate = Array.from({ length: 20 }, () => battle({ oc: 95, potions: 0.9, turns: 9 }));

    expect(evaluateUtilityCandidate(baseline, candidate)).toMatchObject({
      rollback: false,
      reasons: [],
    });
  });
});
