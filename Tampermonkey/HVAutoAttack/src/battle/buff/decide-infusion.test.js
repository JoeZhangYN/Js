import { describe, expect, it } from "vitest";
import { decideInfusion } from "./decide-infusion.js";

const snap = (over = {}) => ({
  attackStatus: 1,
  hp: 100,
  playerBuffs: [],
  ...over,
});

describe("decideInfusion", () => {
  it("infusionSwitch off -> noop", () => {
    expect(decideInfusion({}, snap())).toEqual({ kind: "noop" });
  });

  it("infusionCondition unmet -> noop", () => {
    expect(
      decideInfusion({ infusionSwitch: true, infusionCondition: [["hp,2,50"]] }, snap({ hp: 90 }))
    ).toEqual({ kind: "noop" });
  });

  it("attackStatus 0 -> noop", () => {
    expect(decideInfusion({ infusionSwitch: true }, snap({ attackStatus: 0 }))).toEqual({
      kind: "noop",
    });
  });

  it("existing infusion buff -> noop", () => {
    expect(
      decideInfusion({ infusionSwitch: true }, snap({ playerBuffs: ["fireinfusion"] }))
    ).toEqual({ kind: "noop" });
  });

  it("enabled fire infusion -> click fire infusion item", () => {
    expect(decideInfusion({ infusionSwitch: true }, snap({ attackStatus: 1 }))).toEqual({
      kind: "click",
      selector: '.bti3>div[onmouseover*="12101"]',
    });
  });
});
