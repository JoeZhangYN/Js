import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runBattlePauseAutomation: vi.fn(),
}));

vi.mock("./pause-automation.js", () => ({
  BattlePauseEvent: Object.freeze({ PAUSE: "pause" }),
  runBattlePauseAutomation: mocks.runBattlePauseAutomation,
}));

import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";

function applyResult(result) {
  return runBattleActionEffectDispatch({
    type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
    result,
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.alert = vi.fn();
  mocks.runBattlePauseAutomation.mockReset();
});

describe("battle action effect pause result semantics", () => {
  it("returns not acted when pause automation rejects a pause result", () => {
    mocks.runBattlePauseAutomation.mockReturnValue(false);

    expect(applyResult({ kind: "pause" })).toBe(false);

    expect(mocks.runBattlePauseAutomation).toHaveBeenCalledWith({
      type: "pause",
      reason: "autoPause",
    });
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "pause" },
      acted: false,
      failureReason: "actionExecutorRejected",
    });
  });

  it("returns pause automation result for alert-and-pause effects", () => {
    mocks.runBattlePauseAutomation.mockReturnValue(false);

    expect(
      applyResult({
        kind: "alert-and-pause",
        msg: { l0: "暂停", l1: "暫停", l2: "Pause" },
      })
    ).toBe(false);

    expect(window.alert).toHaveBeenCalledOnce();
    expect(mocks.runBattlePauseAutomation).toHaveBeenCalledWith({
      type: "pause",
      reason: "alertAndPause",
      detail: {
        resultKind: "alert-and-pause",
        msg: { l0: "暂停", l1: "暫停", l2: "Pause" },
      },
    });
  });
});
