import { describe, expect, it } from "vitest";
import { decideDefend } from "./decide-defend.js";

describe("decideDefend", () => {
  it("defend 未开 -> noop", () => {
    expect(decideDefend({}, {})).toEqual({ kind: "noop" });
  });

  it("defendCondition 不满足 -> noop", () => {
    expect(decideDefend({ defend: true, defendCondition: [["hp,2,50"]] }, { hp: 90 })).toEqual({
      kind: "noop",
    });
  });

  it("defend 开启且条件满足 -> defend-command", () => {
    expect(decideDefend({ defend: true }, {})).toEqual({
      kind: "defend-command",
    });
  });
});
