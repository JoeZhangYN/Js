import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";

function rejectedDetail() {
  return {
    responseKind: "jsonReload",
    status: 200,
    reload: true,
    world: { world: "persistent", apiJsonUrl: "https://hentaiverse.org/json" },
    action: { mode: "attack", target: 1 },
  };
}

function makeDeps(sessionStorage = window.sessionStorage) {
  return {
    sessionStorage,
    reload: vi.fn(() => true),
    pause: vi.fn(() => true),
    readDiagnosticEvidence: vi.fn(),
    warn: vi.fn(() => {
      throw new Error("console hook failed");
    }),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API response recovery warning failures", () => {
  it("continues reload recovery when recovery state persistence and warning fail", () => {
    const deps = makeDeps({
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    });

    expect(() =>
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail: rejectedDetail() },
        deps
      )
    ).not.toThrow();

    expect(deps.reload).toHaveBeenCalledWith(
      expect.objectContaining({
        recoveryAction: "reload",
        storageWriteOk: false,
        storageWriteError: "quota",
        reloadResult: true,
      })
    );
  });

  it("keeps repeated-pause recovery accepted when pause warning fails", () => {
    const deps = makeDeps();
    const event = {
      type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
      detail: rejectedDetail(),
    };

    expect(runBattleApiResponseRecovery(event, deps)).toBe("reload");
    expect(runBattleApiResponseRecovery(event, deps)).toBe("paused");
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 2,
      recoveryAction: "pause",
      pauseResult: true,
    });
  });
});
