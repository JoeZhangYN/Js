import { describe, expect, it } from "vitest";
import { createUtilityStyleState } from "./utility-weight-model.js";
import {
  applyUtilityWeightTransition,
  UtilityWeightTransitionEvent,
} from "./utility-weight-transitions.js";

const baselineBattle = Object.freeze({
  oc: 100,
  progress: 10,
  potions: 1,
  turns: 10,
  flee: 0,
  pause: 0,
  recovery: 0,
  outcome: "victory",
});

function transition(state, event) {
  return applyUtilityWeightTransition(state, event).state;
}

describe("utility weight learning state machine", () => {
  it("applies a shadow only at a battle boundary and rolls it back after 20 worse battles", () => {
    let state = createUtilityStyleState();
    state.shadow = {
      multipliers: { OFC: 1.05, FRD: 1, T3: 1, T2: 1, T1: 0.95 },
      means: {},
      benchmark: 1,
    };
    state.baselineWindow = Array.from({ length: 20 }, () => ({ ...baselineBattle }));
    state.activeBattle = { ...baselineBattle, startGlobalTurn: 0 };

    state = transition(state, {
      type: UtilityWeightTransitionEvent.BATTLE_COMPLETED,
      globalTurn: 10,
      outcome: "victory",
    });
    expect(state.multipliers).toMatchObject({ OFC: 1.05, T1: 0.95 });
    expect(state.candidate.evaluation).toEqual([]);

    for (let battle = 0; battle < 20; battle += 1) {
      state.activeBattle = {
        ...baselineBattle,
        oc: 111,
        recovery: 1,
        startGlobalTurn: 0,
      };
      state = transition(state, {
        type: UtilityWeightTransitionEvent.BATTLE_COMPLETED,
        globalTurn: 10,
        outcome: "victory",
      });
    }
    expect(state.candidate).toBeNull();
    expect(state.multipliers).toMatchObject({ OFC: 1, T1: 1 });
    expect(state.lastDecision).toMatchObject({
      kind: "rolledBack",
      reasons: expect.arrayContaining(["ocPerProgressWorseThan10Percent", "recoveryIncreased"]),
    });
  });

  it("carries adverse aborted attempts into the next battle window", () => {
    let state = createUtilityStyleState();
    state.activeBattle = { ...baselineBattle, startGlobalTurn: 2, recovery: 1 };

    state = transition(state, {
      type: UtilityWeightTransitionEvent.BATTLE_STARTED,
      globalTurn: 8,
    });

    expect(state.baselineWindow).toEqual([
      expect.objectContaining({ outcome: "aborted", recovery: 1, turns: 6 }),
    ]);
    expect(state.activeBattle).toMatchObject({ startGlobalTurn: 8, recovery: 0 });
  });
});
