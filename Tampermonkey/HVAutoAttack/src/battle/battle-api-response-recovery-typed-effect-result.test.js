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

function rejectedDetail(extra = {}) {
  return {
    responseKind: "jsonReload",
    status: 200,
    reload: true,
    world: { world: "persistent", apiJsonUrl: "https://hentaiverse.org/json" },
    action: { mode: "attack", target: 1 },
    ...extra,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API response recovery typed effect result evidence", () => {
  it("records typed failed reload scheduling as failed recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue({ kind: "failed", reason: "reloadBridgeRejected" });
    const detail = rejectedDetail({ error: "server_error" });

    runBattleApiResponseRecovery(
      { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
      deps
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "reload",
      reloadResult: false,
      detail,
    });
  });

  it("records typed failed repeated-pause execution as failed recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue(true);
    deps.pause.mockReturnValue({ kind: "failed", reason: "pausePersistenceFailed" });
    const detail = rejectedDetail();
    const event = { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail };

    runBattleApiResponseRecovery(event, deps);
    runBattleApiResponseRecovery(event, deps);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 2,
      recoveryAction: "pause",
      pauseResult: false,
      detail,
    });
  });
});
