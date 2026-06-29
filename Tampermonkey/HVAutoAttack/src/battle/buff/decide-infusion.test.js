import { describe, expect, it } from "vitest";
import { decideInfusion } from "./decide-infusion.js";

const snap = (over = {}) => ({
  opt: { infusionSwitch: true },
  attackStatus: 1,
  conditionFacts: { hp: 100 },
  playerBuffs: [],
  ...over,
});

describe("decideInfusion", () => {
  it("infusionSwitch off -> noop", () => {
    expect(decideInfusion({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("infusionCondition unmet -> noop", () => {
    expect(
      decideInfusion(
        snap({
          opt: { infusionSwitch: true, infusionCondition: [["hp,2,50"]] },
          conditionFacts: { hp: 90 },
        })
      )
    ).toEqual({ kind: "noop" });
  });

  it("attackStatus 0 -> noop", () => {
    expect(decideInfusion(snap({ attackStatus: 0 }))).toEqual({
      kind: "noop",
    });
  });

  it("existing infusion buff -> noop", () => {
    expect(decideInfusion(snap({ playerBuffs: ["fireinfusion"] }))).toEqual({ kind: "noop" });
  });

  it("enabled fire infusion -> item command", () => {
    expect(decideInfusion(snap({ attackStatus: 1 }))).toEqual({
      kind: "item-command",
      itemId: 12101,
    });
  });
});
