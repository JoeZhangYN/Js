import { describe, expect, it } from "vitest";
import { BattleFleeFactsEvent, runBattleFleeFacts } from "./flee-facts.js";

describe("runBattleFleeFacts", () => {
  const snap = { hp: 12, mp: 80 };

  it("reads flee decision facts from a battle snapshot", () => {
    expect(runBattleFleeFacts({ type: BattleFleeFactsEvent.READ_DECISION, snap })).toEqual({
      conditionFacts: snap,
    });
  });

  it("rejects unknown flee facts events as empty facts", () => {
    expect(runBattleFleeFacts({ type: "unknown", snap })).toEqual({});
  });
});
