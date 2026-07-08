import { describe, expect, it } from "vitest";
import { BattlePotionEconomyEvent, runBattlePotionEconomy } from "./potion-economy.js";

function isWasteful({
  potionId = 11195,
  deficitFacts = { hpDeficit: 100 },
  tolerance,
  readRecovery,
} = {}) {
  return runBattlePotionEconomy({
    type: BattlePotionEconomyEvent.IS_WASTEFUL,
    potionId,
    deficitFacts,
    tolerance,
    readRecovery,
  });
}

describe("potion economy", () => {
  it("requires the recovery learner query for waste decisions", () => {
    expect(() => isWasteful({ tolerance: 0.7 })).toThrow("requires recovery learner query");
  });

  it("uses the injected recovery answer when checking waste", () => {
    const readRecovery = () => ({ stat: "hp", amount: 500 });

    expect(isWasteful({ deficitFacts: { hpDeficit: 300 }, tolerance: 0.7, readRecovery })).toBe(
      true
    );
    expect(isWasteful({ deficitFacts: { hpDeficit: 400 }, tolerance: 0.7, readRecovery })).toBe(
      false
    );
  });

  it("rejects unknown potion economy events", () => {
    expect(runBattlePotionEconomy({ type: "unknown" })).toBe(false);
    expect(runBattlePotionEconomy(null)).toBe(false);
  });
});
