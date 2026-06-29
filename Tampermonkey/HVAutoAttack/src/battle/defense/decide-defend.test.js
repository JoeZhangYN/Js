import { describe, expect, it } from "vitest";
import { decideDefend } from "./decide-defend.js";

describe("decideDefend", () => {
  it("defend 未开 -> noop", () => {
    expect(decideDefend({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("defendCondition 不满足 -> noop", () => {
    expect(
      decideDefend({
        opt: { defend: true, defendCondition: [["hp,2,50"]] },
        conditionFacts: { hp: 90 },
      })
    ).toEqual({ kind: "noop" });
  });

  it("defend 开启且条件满足 -> defend-command", () => {
    expect(decideDefend({ opt: { defend: true }, conditionFacts: {} })).toEqual({
      kind: "defend-command",
    });
  });
});
