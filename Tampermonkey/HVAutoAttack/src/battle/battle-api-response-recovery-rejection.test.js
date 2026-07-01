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

  it("preserves explicit API bridge rejection reasons", () => {
    const deps = makeDeps();

    runBattleApiResponseRecovery(
      {
        type: BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT,
        detail: { eventType: "install", reason: "apiRecoveryBridgeInstallFailed" },
      },
      deps
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "apiRecoveryBridgeInstallFailed",
        eventType: "install",
      },
    });
  });

  it("carries recent diagnostics into rejected recovery events without nesting recovery state", () => {
    const deps = makeDeps();
    deps.readDiagnosticEvidence.mockReturnValue({
      battleApiResponseRecovery: { repeatCount: 9 },
      battleActionDecision: { steps: [{ capability: "attack", acted: false }] },
      battleActionEffect: { result: { kind: "noop" }, acted: false },
    });

    expect(runBattleApiResponseRecovery({ type: "unknown" }, deps)).toBe(false);

    const state = JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"));
    expect(state).toMatchObject({
      repeatCount: 1,
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "unknownApiResponseRecoveryEvent",
        eventType: "unknown",
      },
      diagnosticEvidence: {
        battleActionDecision: { steps: [{ capability: "attack", acted: false }] },
        battleActionEffect: { result: { kind: "noop" }, acted: false },
      },
    });
    expect(state.diagnosticEvidence.battleApiResponseRecovery).toBeUndefined();
  });
});
