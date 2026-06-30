import { describe, expect, it } from "vitest";
import { CriticalBuffFactsEvent, runCriticalBuffFacts } from "./critical-buff-facts.js";

describe("runCriticalBuffFacts", () => {
  const snap = {
    mp: 24,
    playerEffects: [{ name: "Haste", turns: 1 }],
  };

  it("reads critical buff decision facts from a battle snapshot", () => {
    expect(runCriticalBuffFacts({ type: CriticalBuffFactsEvent.READ_DECISION, snap })).toEqual({
      manaPercent: 24,
      playerEffects: [{ name: "Haste", turns: 1 }],
    });
  });

  it("rejects unknown critical buff facts events as empty facts", () => {
    expect(runCriticalBuffFacts({ type: "unknown", snap })).toEqual({});
  });
});
