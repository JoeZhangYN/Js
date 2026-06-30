import { describe, expect, it } from "vitest";
import { BattleDynamicThresholdEvent, runBattleDynamicThreshold } from "./dynamic-threshold.js";

function readHpThreshold(facts, opt) {
  return runBattleDynamicThreshold({
    type: BattleDynamicThresholdEvent.READ_HP_THRESHOLD,
    facts,
    opt,
  });
}

describe("runBattleDynamicThreshold", () => {
  it("uses fallback hp threshold when dynamic healing is disabled", () => {
    expect(readHpThreshold({}, { hp1: 55, dynamicHealThreshold: false })).toBe(55);
  });

  it("uses fallback hp threshold when incoming damage samples are sparse", () => {
    expect(
      readHpThreshold(
        { playerIncomingDps: { sampleCount: 1, perTurnP95: 4000 } },
        { hp1: 50, dynamicHealThreshold: true }
      )
    ).toBe(50);
  });

  it("raises threshold from remaining monster hp and incoming damage", () => {
    expect(
      readHpThreshold(
        {
          attackStatus: 0,
          aliveMonsterHpPercents: [80, 40],
          playerIncomingDps: { sampleCount: 3, perTurnP95: 3000 },
        },
        {
          dynamicHealThreshold: true,
          hp1: 50,
          dynamicHealSafetyPad: 1.3,
          playerMaxHp: 17000,
        }
      )
    ).toBe(80);
  });

  it("rejects unknown dynamic threshold events", () => {
    expect(runBattleDynamicThreshold({ type: "unknown" })).toBeUndefined();
  });
});
