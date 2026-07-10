import { describe, expect, it } from "vitest";
import {
  createUtilityActionPending,
  settleUtilityActionObservation,
} from "./utility-weight-observation.js";

describe("physical skill utility observation", () => {
  it("measures progress and OC-normalized resource efficiency from one action", () => {
    const pending = createUtilityActionPending({
      code: "T2",
      ocCost: 60,
      globalTurn: 10,
      view: [
        { id: 1, hpAbsNow: 100, hpMax: 100, isDead: false },
        { id: 2, hpAbsNow: 100, hpMax: 100, isDead: false },
      ],
    });

    expect(
      settleUtilityActionObservation(pending, [
        { id: 1, hpAbsNow: 50, hpMax: 100, isDead: false },
        { id: 2, hpAbsNow: 0, hpMax: 100, isDead: true },
      ])
    ).toMatchObject({
      damage: 150,
      killed: 1,
      preActionAliveMaxHp: 200,
      preActionAliveCount: 2,
      progress: 1.25,
      resourceEfficiency: 0.625,
    });
  });

  it("rejects unsupported skills and missing authoritative monster facts", () => {
    expect(createUtilityActionPending({ code: "spell", ocCost: 30, view: [] })).toBeNull();
    expect(settleUtilityActionObservation(null, [])).toBeNull();
  });
});
