import { describe, expect, it } from "vitest";
import { decideFlee } from "./decide-flee.js";

describe("decideFlee", () => {
  it("autoFlee 未开 -> noop", () => {
    expect(decideFlee({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("fleeCondition 不满足 -> noop", () => {
    expect(
      decideFlee({
        opt: { autoFlee: true, fleeCondition: [["hp,2,50"]] },
        conditionFacts: { hp: 90 },
      })
    ).toEqual({ kind: "noop" });
  });

  it("autoFlee 开启且条件满足 -> flee-command", () => {
    expect(decideFlee({ opt: { autoFlee: true }, conditionFacts: {} })).toEqual({
      kind: "flee-command",
    });
  });
});
