import { describe, expect, it } from "vitest";
import { BattleItemFactsEvent, runBattleItemFacts } from "./item-facts.js";

describe("runBattleItemFacts", () => {
  const snap = {
    gemName: "Health Gem",
    hp: 41,
    mp: 52,
    sp: 63,
    attackStatus: 1,
    view: [
      { isDead: false, hpPercent: 75 },
      { isDead: true, hpPercent: 0 },
    ],
    playerIncomingDps: { sampleCount: 2, perTurnP95: 1000 },
    roundNow: 1,
    roundAll: 3,
    oc: 80,
    spiritOn: true,
    globalTurn: 9,
    lastSpiritToggleGlobalTurn: 3,
    playerBuffs: ["protection"],
    roundType: "arena",
    hpDeficit: 100,
    mpDeficit: 200,
    spDeficit: 300,
  };

  it("reads gem decision facts from a battle snapshot", () => {
    expect(runBattleItemFacts({ type: BattleItemFactsEvent.READ_GEM, snap })).toEqual({
      gemName: "Health Gem",
      healthPercent: 41,
      manaPercent: 52,
      spiritPercent: 63,
      attackStatus: 1,
      aliveMonsterHpPercents: [75],
      playerIncomingDps: { sampleCount: 2, perTurnP95: 1000 },
    });
  });

  it("reads stall top-up facts from a battle snapshot", () => {
    expect(runBattleItemFacts({ type: BattleItemFactsEvent.READ_STALL_TOPUP, snap })).toEqual({
      roundNow: 1,
      roundAll: 3,
      monsterFacts: snap.view,
      overcharge: 80,
      manaPercent: 52,
      spiritPercent: 63,
      spiritOn: true,
      globalTurn: 9,
      lastSpiritToggleGlobalTurn: 3,
      playerBuffs: ["protection"],
    });
  });

  it("reads scroll and potion facts from a battle snapshot", () => {
    expect(runBattleItemFacts({ type: BattleItemFactsEvent.READ_SCROLL, snap })).toEqual({
      conditionFacts: snap,
      roundType: "arena",
      playerBuffs: ["protection"],
    });
    expect(runBattleItemFacts({ type: BattleItemFactsEvent.READ_POTION, snap })).toEqual({
      conditionFacts: snap,
      deficitFacts: {
        hpDeficit: 100,
        mpDeficit: 200,
        spDeficit: 300,
      },
    });
  });

  it("rejects unknown item facts events", () => {
    expect(runBattleItemFacts({ type: "unknown", snap })).toBeUndefined();
    expect(runBattleItemFacts(null)).toBeUndefined();
  });
});
