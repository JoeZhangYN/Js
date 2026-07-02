import { describe, expect, it } from "vitest";
import { BattleDefendFactsEvent, runBattleDefendFacts } from "./defend-facts.js";

describe("runBattleDefendFacts", () => {
  const snap = { hp: 40, mp: 20 };

  it("reads defend decision facts from a battle snapshot", () => {
    expect(runBattleDefendFacts({ type: BattleDefendFactsEvent.READ_DECISION, snap })).toEqual({
      conditionFacts: snap,
    });
  });

  it("rejects unknown defend facts events as empty facts", () => {
    expect(runBattleDefendFacts({ type: "unknown", snap })).toEqual({});
    expect(runBattleDefendFacts(null)).toEqual({});
  });
});
