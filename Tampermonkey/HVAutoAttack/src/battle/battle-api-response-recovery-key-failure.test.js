import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";

function makeDeps() {
  return {
    sessionStorage: window.sessionStorage,
    reload: vi.fn(),
    pause: vi.fn(),
    readDiagnosticEvidence: vi.fn(),
    warn: vi.fn(),
  };
}

function circularRejectedDetail() {
  const action = { mode: "attack", target: 1 };
  action.self = action;
  return {
    responseKind: "jsonReload",
    status: 200,
    reload: true,
    world: { world: "persistent", apiJsonUrl: "https://hentaiverse.org/json" },
    action,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API response recovery key failures", () => {
  it("continues reload recovery when API failure identity cannot be serialized", () => {
    const deps = makeDeps();
    const detail = circularRejectedDetail();

    expect(() =>
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
        deps
      )
    ).not.toThrow();

    expect(deps.reload).toHaveBeenCalledWith(
      expect.objectContaining({
        repeatCount: 1,
        recoveryAction: "reload",
        apiFailureKeyError: expect.stringContaining("circular"),
      })
    );
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "reload",
      apiFailureKeyError: expect.stringContaining("circular"),
    });
  });

  it("still pauses repeated unserializable API response loops", () => {
    const deps = makeDeps();
    const event = {
      type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
      detail: circularRejectedDetail(),
    };

    runBattleApiResponseRecovery(event, deps);
    expect(runBattleApiResponseRecovery(event, deps)).toBe("paused");

    expect(deps.reload).toHaveBeenCalledTimes(1);
    expect(deps.pause).toHaveBeenCalledWith(
      expect.objectContaining({
        repeatCount: 2,
        recoveryAction: "pause",
        apiFailureKeyError: expect.stringContaining("circular"),
      })
    );
  });
});
