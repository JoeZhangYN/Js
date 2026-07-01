import { describe, expect, it } from "vitest";
import { BattleFleeDecisionEvent, runBattleFleeDecision } from "./decide-flee.js";

function decideFlee(event) {
  return runBattleFleeDecision({ type: BattleFleeDecisionEvent.DECIDE, ...event });
}

describe("decideFlee", () => {
  it("autoFlee 未开 -> noop", () => {
    expect(decideFlee({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("fleeCondition 不满足 -> noop", () => {
    expect(
      decideFlee({
        opt: { autoFlee: true, fleeCondition: [["hp,2,50"]] },
        conditionFacts: { hp: 90 },
      })
    ).toEqual({ kind: "noop" });
  });

  it("autoFlee 开启且条件满足 -> flee-command", () => {
    expect(decideFlee({ opt: { autoFlee: true }, conditionFacts: {} })).toEqual({
      kind: "flee-command",
    });
  });

  it("entry maps snap facts internally", () => {
    expect(
      decideFlee({
        opt: { autoFlee: true, fleeCondition: [["hp,2,50"]] },
        snap: { hp: 40 },
      })
    ).toEqual({ kind: "flee-command" });
  });

  it("rejects unknown flee decision events", () => {
    expect(runBattleFleeDecision({ type: "unknown", opt: { autoFlee: true } })).toEqual({
      kind: "noop",
    });
    expect(runBattleFleeDecision(null)).toEqual({ kind: "noop" });
  });
});
