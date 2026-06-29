import { describe, expect, it } from "vitest";
import { isPotionWasteful } from "./potion-economy.js";

describe("potion economy", () => {
  it("requires the recovery learner query for waste decisions", () => {
    expect(() => isPotionWasteful(11195, { hpDeficit: 100 }, 0.7)).toThrow(
      "requires recovery learner query"
    );
  });

  it("uses the injected recovery answer when checking waste", () => {
    const readRecovery = () => ({ stat: "hp", amount: 500 });

    expect(isPotionWasteful(11195, { hpDeficit: 300 }, 0.7, readRecovery)).toBe(true);
    expect(isPotionWasteful(11195, { hpDeficit: 400 }, 0.7, readRecovery)).toBe(false);
  });
});
