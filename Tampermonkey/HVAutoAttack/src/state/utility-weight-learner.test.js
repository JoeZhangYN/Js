import { describe, expect, it, vi } from "vitest";
import {
  createUtilityWeightLearningCapability,
  UtilityWeightLearningEvent,
} from "./utility-weight-learner.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { normalizeUtilityMultipliers } from "./utility-weight-model.js";

function storage(seed) {
  let value = seed;
  return {
    getValue: vi.fn(() => value),
    setValue: vi.fn((_key, next) => {
      value = next;
    }),
  };
}

function seeded(multiplier) {
  return {
    schemaVersion: 1,
    styles: {
      1: { multipliers: { OFC: multiplier, FRD: 1, T3: 1, T2: 1, T1: 1 } },
      2: { multipliers: { OFC: 0.9, FRD: 1, T3: 1, T2: 1, T1: 1 } },
    },
  };
}

function capability(store, option = { utilityWeightLearning: true, fightingStyle: "1" }) {
  return createUtilityWeightLearningCapability(store, {
    auditIdentity: "hv:test",
    readGlobalTurn: () => 10,
    readOptionField: (key, fallback) => option[key] ?? fallback,
    recordDecision: vi.fn(),
    recordFailure: vi.fn(),
  });
}

describe("factory-bound utility weight learning", () => {
  it("clamps persisted multipliers to the 0.8-1.2 safety envelope", () => {
    expect(normalizeUtilityMultipliers({ OFC: 99, T1: -1 })).toMatchObject({
      OFC: 1.2,
      T1: 0.8,
    });
  });

  it("isolates World through bound storage and style inside each World document", () => {
    const persistent = storage(seeded(1.1));
    const isekai = storage(seeded(0.95));

    expect(
      capability(persistent).run({ type: UtilityWeightLearningEvent.READ_MULTIPLIERS }).OFC
    ).toBe(1.1);
    expect(capability(isekai).run({ type: UtilityWeightLearningEvent.READ_MULTIPLIERS }).OFC).toBe(
      0.95
    );
    expect(
      capability(persistent, { utilityWeightLearning: true, fightingStyle: "2" }).run({
        type: UtilityWeightLearningEvent.READ_MULTIPLIERS,
      }).OFC
    ).toBe(0.9);
    expect(persistent.getValue).toHaveBeenCalledWith(STORAGE_KEYS.UTILITY_WEIGHT_LEARNING, true);
  });

  it("is default-off and does not read learning storage", () => {
    const store = storage(seeded(1.1));
    const multipliers = capability(store, {
      utilityWeightLearning: false,
      fightingStyle: "1",
    }).run({ type: UtilityWeightLearningEvent.READ_MULTIPLIERS });

    expect(multipliers).toEqual({ OFC: 1, FRD: 1, T3: 1, T2: 1, T1: 1 });
    expect(store.getValue).not.toHaveBeenCalled();
  });

  it("fails closed when the authoritative learning write fails", () => {
    const store = storage(null);
    store.setValue.mockImplementation(() => {
      throw new Error("learning write blocked");
    });
    const failure = vi.fn();
    const learner = createUtilityWeightLearningCapability(store, {
      auditIdentity: "hv:test",
      readGlobalTurn: () => 10,
      readOptionField: (key, fallback) =>
        ({ utilityWeightLearning: true, fightingStyle: "1" })[key] ?? fallback,
      recordDecision: vi.fn(),
      recordFailure: failure,
    });

    expect(learner.run({ type: UtilityWeightLearningEvent.BATTLE_STARTED })).toEqual({
      kind: "failed",
      reason: "storageWriteFailed",
    });
    expect(failure).toHaveBeenCalledWith(
      "write",
      expect.objectContaining({ auditIdentity: "hv:test", error: "learning write blocked" })
    );
  });
});
