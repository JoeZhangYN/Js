import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";

function makeDeps() {
  return {
    sessionStorage: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    },
    reload: vi.fn(),
    pause: vi.fn(),
    readDiagnosticEvidence: vi.fn(),
    warn: vi.fn(),
  };
}

function rejectedDetail() {
  return {
    responseKind: "jsonReload",
    status: 200,
    reload: true,
    world: { world: "persistent", apiJsonUrl: "https://hentaiverse.org/json" },
    action: { mode: "attack", target: 1 },
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API response recovery persistence failures", () => {
  it("continues reload recovery when recovery state persistence fails", () => {
    const deps = makeDeps();

    expect(
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail: rejectedDetail() },
        deps
      )
    ).toBe("reload");

    expect(deps.reload).toHaveBeenCalledWith(
      expect.objectContaining({
        repeatCount: 1,
        recoveryAction: "reload",
        storageWriteOk: false,
        storageWriteError: "quota",
      })
    );
    expect(deps.warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery state write failed",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("rejects unknown recovery events without throwing when persistence fails", () => {
    const deps = makeDeps();

    expect(runBattleApiResponseRecovery({ type: "unknown" }, deps)).toBe(false);

    expect(deps.reload).not.toHaveBeenCalled();
    expect(deps.pause).not.toHaveBeenCalled();
    expect(deps.warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery state write failed",
      expect.objectContaining({
        recoveryAction: "rejected",
        storageWriteOk: false,
        storageWriteError: "quota",
      })
    );
  });
});
