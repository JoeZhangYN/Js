import { describe, expect, it } from "vitest";
import { decideAutoPause } from "./decide-auto-pause.js";

describe("decideAutoPause", () => {
  it("autoPause 未开 -> noop", () => {
    expect(decideAutoPause({ opt: {}, conditionFacts: {} })).toEqual({ kind: "noop" });
  });

  it("pauseCondition 不满足 -> noop", () => {
    expect(
      decideAutoPause({
        opt: { autoPause: true, pauseCondition: [["hp,2,50"]] },
        conditionFacts: { hp: 90 },
      })
    ).toEqual({ kind: "noop" });
  });

  it("autoPause 开启且条件满足 -> pause", () => {
    expect(decideAutoPause({ opt: { autoPause: true }, conditionFacts: {} })).toEqual({
      kind: "pause",
    });
  });

  it("entry maps snap facts internally", () => {
    expect(
      decideAutoPause({
        opt: { autoPause: true, pauseCondition: [["hp,2,50"]] },
        snap: { hp: 40 },
      })
    ).toEqual({ kind: "pause" });
  });
});
