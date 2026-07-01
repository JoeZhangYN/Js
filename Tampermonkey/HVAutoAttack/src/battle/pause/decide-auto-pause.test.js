import { describe, expect, it } from "vitest";
import {
  BattleAutoPauseDecisionEvent,
  runBattleAutoPauseDecision,
} from "./decide-auto-pause.js";

function decideAutoPause(event) {
  return runBattleAutoPauseDecision({ type: BattleAutoPauseDecisionEvent.DECIDE, ...event });
}

describe("decideAutoPause", () => {
  it("autoPause 未开 -> noop", () => {
    expect(decideAutoPause({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("pauseCondition 不满足 -> noop", () => {
    expect(
      decideAutoPause({
        opt: { autoPause: true, pauseCondition: [["hp,2,50"]] },
        conditionFacts: { hp: 90 },
      })
    ).toEqual({ kind: "noop" });
  });

  it("autoPause 开启且条件满足 -> pause", () => {
    expect(decideAutoPause({ opt: { autoPause: true }, conditionFacts: {} })).toEqual({
      kind: "pause",
    });
  });

  it("entry maps snap facts internally", () => {
    expect(
      decideAutoPause({
        opt: { autoPause: true, pauseCondition: [["hp,2,50"]] },
        snap: { hp: 40 },
      })
    ).toEqual({ kind: "pause" });
  });

  it("rejects unknown auto-pause decision events", () => {
    expect(runBattleAutoPauseDecision({ type: "unknown", opt: { autoPause: true } })).toEqual({
      kind: "noop",
    });
    expect(runBattleAutoPauseDecision(null)).toEqual({ kind: "noop" });
  });
});
