import { describe, expect, it } from "vitest";
import {
  BattleDebuffCoverageEvent,
  runBattleDebuffCoverageAutomation,
} from "./battle-debuff-coverage.js";

const hasMissing = (monsterBuffs, debuffName = "weaken", monsterAlive = monsterBuffs.length) =>
  runBattleDebuffCoverageAutomation({
    type: BattleDebuffCoverageEvent.HAS_MISSING_DEBUFF,
    monsterBuffs,
    debuffName,
    monsterAlive,
  });

describe("battle debuff coverage", () => {
  it("reports missing coverage when fewer alive monsters carry the debuff", () => {
    expect(hasMissing([["weaken"], []])).toBe(true);
  });

  it("reports complete coverage when every alive monster carries the debuff", () => {
    expect(hasMissing([["weaken"], ["weaken"]])).toBe(false);
  });

  it("uses rule runtime alive count when supplied", () => {
    expect(hasMissing([["imperil"]], "imperil", 2)).toBe(true);
  });
});
