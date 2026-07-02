import { describe, expect, it } from "vitest";
import { BattleDebuffFactsEvent, runBattleDebuffFacts } from "./debuff-facts.js";

describe("runBattleDebuffFacts", () => {
  const monster = {
    id: 7,
    order: 2,
    monsterId: 99,
    isDead: false,
    isBoss: true,
    buffs: ["weaken"],
    hpMax: 5000,
    hpPercent: 0.6,
  };
  const snap = {
    hpAbs: 1200,
    skillReady: { 213: true, 232: false },
    learnedBurstByMid: { 99: { maxHit: 900, type: "fire" } },
    view: [monster],
    spellAoe: { Imperil: 2 },
    cdMap: { 213: 0 },
    oc: 55,
    roundNow: 1,
    roundAll: 3,
    monsterAlive: 1,
    aliveCount: 1,
  };

  it("reads burst-control facts from a battle snapshot", () => {
    expect(runBattleDebuffFacts({ type: BattleDebuffFactsEvent.READ_BURST_CONTROL, snap })).toEqual({
      healthAbs: 1200,
      skillReady: { 213: true, 232: false },
      learnedBurstByMid: { 99: { maxHit: 900, type: "fire" } },
      monsterFacts: [monster],
    });
  });

  it("reads boss Imperil facts from a battle snapshot", () => {
    expect(runBattleDebuffFacts({ type: BattleDebuffFactsEvent.READ_BOSS_IMPERIL, snap })).toEqual({
      imperilSkillReady: true,
      imperilAoe: 2,
      skillCooldowns: { 213: 0 },
      overcharge: 55,
      roundNow: 1,
      roundAll: 3,
      monsterFacts: [
        {
          id: 7,
          order: 2,
          monsterId: 99,
          isDead: false,
          isBoss: true,
          buffs: ["weaken"],
          hpMax: 5000,
          hpPercent: 0.6,
        },
      ],
    });
  });

  it("reads generic debuff action facts from a battle snapshot", () => {
    expect(runBattleDebuffFacts({ type: BattleDebuffFactsEvent.READ_DEBUFF_ACTION, snap })).toEqual({
      conditionFacts: snap,
      monsterAlive: 1,
      skillReady: { 213: true, 232: false },
      spellAoe: { Imperil: 2 },
      skillCooldowns: { 213: 0 },
      aliveCount: 1,
      overcharge: 55,
      roundNow: 1,
      roundAll: 3,
      monsterFacts: [monster],
    });
  });

  it("rejects unknown debuff facts events", () => {
    expect(runBattleDebuffFacts({ type: "unknown", snap })).toBeUndefined();
    expect(runBattleDebuffFacts(null)).toBeUndefined();
  });
});
