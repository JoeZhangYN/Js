import { describe, expect, it } from "vitest";
import { decideAutoPause } from "./decide-auto-pause.js";

describe("decideAutoPause", () => {
  it("autoPause 未开 -> noop", () => {
    expect(decideAutoPause({}, {})).toEqual({ kind: "noop" });
  });

  it("pauseCondition 不满足 -> noop", () => {
    expect(decideAutoPause({ autoPause: true, pauseCondition: [["hp,2,50"]] }, { hp: 90 })).toEqual(
      { kind: "noop" }
    );
  });

  it("autoPause 开启且条件满足 -> pause", () => {
    expect(decideAutoPause({ autoPause: true }, {})).toEqual({ kind: "pause" });
  });
});
