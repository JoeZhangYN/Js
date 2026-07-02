import { beforeEach, describe, expect, it } from "vitest";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";
import { g } from "./store.js";

beforeEach(() => {
  g("turn", 0);
});

describe("runBattleTurnAutomation", () => {
  it("resets the current battle turn at round start", () => {
    g("turn", 7);

    expect(runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED })).toBe(0);
    expect(g("turn")).toBe(0);
  });

  it("advances and reads the current battle turn through one entry", () => {
    expect(runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED })).toBe(1);
    expect(runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED })).toBe(2);

    expect(runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT })).toBe(2);
  });

  it("rejects unknown and null battle turn events without changing turn state", () => {
    g("turn", 5);

    expect(runBattleTurnAutomation({ type: "unknown" })).toBeUndefined();
    expect(runBattleTurnAutomation(null)).toBeUndefined();
    expect(g("turn")).toBe(5);
  });
});
