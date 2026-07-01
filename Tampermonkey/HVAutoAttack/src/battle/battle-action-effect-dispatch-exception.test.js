import { beforeEach, describe, expect, it } from "vitest";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle action effect dispatch executor exceptions", () => {
  it("records executor exceptions as not acted action effect evidence", () => {
    expect(
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: { kind: "alert-and-pause" },
      })
    ).toBe(false);

    const evidence = JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"));
    expect(evidence).toMatchObject({
      result: { kind: "alert-and-pause" },
      acted: false,
      knownResultKind: true,
      failureReason: "actionExecutorThrew",
    });
    expect(evidence.executionError).toContain("l0");
  });
});
