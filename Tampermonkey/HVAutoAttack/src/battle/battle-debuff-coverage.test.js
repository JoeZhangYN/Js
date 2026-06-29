import { describe, expect, it } from "vitest";
import {
  BattleDebuffCoverageEvent,
  runBattleDebuffCoverageAutomation,
} from "./battle-debuff-coverage.js";

const hasMissing = (snap, debuffName = "weaken", monsterAlive = snap.monsterAlive) =>
  runBattleDebuffCoverageAutomation({
    type: BattleDebuffCoverageEvent.HAS_MISSING_DEBUFF,
    snap,
    debuffName,
    monsterAlive,
  });

describe("battle debuff coverage", () => {
  it("reports missing coverage when fewer alive monsters carry the debuff", () => {
    expect(
      hasMissing({
        monsterAlive: 2,
        view: [{ buffs: ["weaken"] }, { buffs: [] }],
      })
    ).toBe(true);
  });

  it("reports complete coverage when every alive monster carries the debuff", () => {
    expect(
      hasMissing({
        monsterAlive: 2,
        view: [{ buffs: ["weaken"] }, { buffs: ["weaken"] }],
      })
    ).toBe(false);
  });

  it("uses rule runtime alive count when supplied", () => {
    expect(hasMissing({ monsterAlive: 1, view: [{ buffs: ["imperil"] }] }, "imperil", 2)).toBe(
      true
    );
  });
});
