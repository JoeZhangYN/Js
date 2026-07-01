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

describe("battle API response recovery bridge install failures", () => {
  it("records recovery bridge install target failures without throwing", () => {
    const deps = makeDeps();
    const target = {};
    Object.defineProperty(target, "HVAA_battleApiRecovery", {
      set() {
        throw new Error("bridge setter failed");
      },
    });

    expect(
      runBattleApiResponseRecovery(
        {
          type: BattleApiResponseRecoveryEvent.INSTALL_BRIDGE,
          target,
        },
        deps
      )
    ).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "apiRecoveryBridgeInstallThrew",
        eventType: "installBridge",
        step: "target",
        error: "bridge setter failed",
      },
    });
  });
});
