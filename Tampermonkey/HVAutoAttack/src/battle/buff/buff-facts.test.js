import { describe, expect, it } from "vitest";
import { BattleBuffFactsEvent, runBattleBuffFacts } from "./buff-facts.js";

describe("runBattleBuffFacts", () => {
  const snap = {
    attackStatus: 1,
    channeling: "FUS",
    skillReady: { 241: true },
    playerEffects: { haste: true },
    playerBuffs: ["Spirit Shield"],
    spiritOn: true,
    playerEffectTurns: { haste: 8 },
  };

  it("reads buff preparation facts from a battle snapshot", () => {
    expect(runBattleBuffFacts({ type: BattleBuffFactsEvent.READ_PREPARATION, snap })).toEqual({
      conditionFacts: snap,
      attackStatus: 1,
      channeling: "FUS",
      skillReady: { 241: true },
      playerEffects: { haste: true },
      playerBuffs: ["Spirit Shield"],
      spiritOn: true,
      playerEffectTurns: { haste: 8 },
    });
  });

  it("rejects unknown buff facts events as empty facts", () => {
    expect(runBattleBuffFacts({ type: "unknown", snap })).toEqual({});
    expect(runBattleBuffFacts(null)).toEqual({});
  });
});
