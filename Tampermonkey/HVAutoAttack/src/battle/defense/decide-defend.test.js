import { describe, expect, it } from "vitest";
import { BattleDefendDecisionEvent, runBattleDefendDecision } from "./decide-defend.js";

function decideDefend(event) {
  return runBattleDefendDecision({ type: BattleDefendDecisionEvent.DECIDE, ...event });
}

describe("decideDefend", () => {
  it("defend 未开 -> noop", () => {
    expect(decideDefend({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("defendCondition 不满足 -> noop", () => {
    expect(
      decideDefend({
        opt: { defend: true, defendCondition: [["hp,2,50"]] },
        conditionFacts: { hp: 90 },
      })
    ).toEqual({ kind: "noop" });
  });

  it("defend 开启且条件满足 -> defend-command", () => {
    expect(decideDefend({ opt: { defend: true }, conditionFacts: {} })).toEqual({
      kind: "defend-command",
    });
  });

  it("entry maps snap facts internally", () => {
    expect(
      decideDefend({
        opt: { defend: true, defendCondition: [["hp,2,50"]] },
        snap: { hp: 40 },
      })
    ).toEqual({ kind: "defend-command" });
  });

  it("rejects unknown defend decision events", () => {
    expect(runBattleDefendDecision({ type: "unknown", opt: { defend: true } })).toEqual({
      kind: "noop",
    });
    expect(runBattleDefendDecision(null)).toEqual({ kind: "noop" });
  });
});
