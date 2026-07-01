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

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API response recovery event rejection", () => {
  it("rejects unknown recovery events with structured evidence", () => {
    const deps = makeDeps();

    expect(runBattleApiResponseRecovery({ type: "unknown" }, deps)).toBe(false);

    expect(deps.reload).not.toHaveBeenCalled();
    expect(deps.pause).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "unknownApiResponseRecoveryEvent",
        eventType: "unknown",
      },
    });
  });

  it("rejects null recovery events with structured evidence instead of throwing", () => {
    const deps = makeDeps();

    expect(runBattleApiResponseRecovery(null, deps)).toBe(false);

    expect(deps.reload).not.toHaveBeenCalled();
    expect(deps.pause).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "unknownApiResponseRecoveryEvent",
        eventType: null,
      },
    });
  });

  it("records rejected API bridge events with bridge identity", () => {
    const deps = makeDeps();

    expect(
      runBattleApiResponseRecovery(
        {
          type: BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT,
          detail: { eventType: "unknown" },
        },
        deps
      )
    ).toBe(false);

    expect(deps.reload).not.toHaveBeenCalled();
    expect(deps.pause).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "unknownApiBridgeEvent",
        eventType: "unknown",
      },
    });
  });
});
