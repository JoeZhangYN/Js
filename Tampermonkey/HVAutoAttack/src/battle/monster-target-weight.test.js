import { describe, expect, it } from "vitest";
import { MonsterTargetWeightEvent, runMonsterTargetWeight } from "./monster-target-weight.js";

describe("monster target weight", () => {
  it("applies configured debuff weights to live monster target order", () => {
    const monsterStatus = [
      { order: 0, monsterId: 101, currentHp: 501, isDead: false },
      { order: 1, monsterId: 202, currentHp: 1001, isDead: false },
    ];

    expect(
      runMonsterTargetWeight({
        type: MonsterTargetWeightEvent.APPLY,
        monsterStatus,
        runtimeSnapshot: [
          { order: 0, activeDebuffKeys: ["Sle"] },
          { order: 1, activeDebuffKeys: [] },
        ],
        options: { ruleReverse: false, weight: { Sle: 5 } },
      })
    ).toEqual([
      expect.objectContaining({ monsterId: 101, finWeight: 15 }),
      expect.objectContaining({ monsterId: 202, finWeight: 19.98003992015968 }),
    ]);
  });

  it("treats missing debuff option weights as zero instead of NaN", () => {
    const monsterStatus = [{ order: 0, monsterId: 101, currentHp: 500, isDead: false }];

    expect(
      runMonsterTargetWeight({
        type: MonsterTargetWeightEvent.APPLY,
        monsterStatus,
        runtimeSnapshot: [{ order: 0, activeDebuffKeys: ["Sle"] }],
        options: { ruleReverse: false, weight: {} },
      })[0].finWeight
    ).toBe(10);
  });

  it("keeps dead and invalid-HP monsters untargetable", () => {
    const monsterStatus = [
      { order: 0, monsterId: 101, currentHp: Infinity, isDead: true },
      { order: 1, monsterId: 202, currentHp: NaN, isDead: false },
    ];

    expect(
      runMonsterTargetWeight({
        type: MonsterTargetWeightEvent.APPLY,
        monsterStatus,
        runtimeSnapshot: [
          { order: 0, activeDebuffKeys: ["Sle"] },
          { order: 1, activeDebuffKeys: ["Sle"] },
        ],
        options: { ruleReverse: false, weight: { Sle: 5 } },
      })
    ).toEqual([
      expect.objectContaining({ monsterId: 101, finWeight: Infinity }),
      expect.objectContaining({ monsterId: 202, finWeight: Infinity }),
    ]);
  });

  it("rejects unknown monster target weight events", () => {
    expect(
      runMonsterTargetWeight({
        type: "unknown",
        monsterStatus: [{ order: 0, currentHp: 500, isDead: false }],
      })
    ).toEqual([]);
  });
});
