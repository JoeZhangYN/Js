import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleApiResponseRecovery } from "./battle-api-response-recovery.js";

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

describe("runBattleApiResponseRecovery null event", () => {
  it("rejects null recovery events with structured evidence instead of reloading", () => {
    const deps = makeDeps();

    expect(runBattleApiResponseRecovery(null, deps)).toBe(false);

    expect(deps.reload).not.toHaveBeenCalled();
    expect(deps.pause).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "unknownApiResponseRecoveryEvent",
        eventType: null,
      },
    });
  });
});
