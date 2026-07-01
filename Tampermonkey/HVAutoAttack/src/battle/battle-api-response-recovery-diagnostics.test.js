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

describe("battle API response recovery diagnostics", () => {
  it("exposes API recovery state through recent diagnostic evidence", () => {
    const deps = makeDeps();
    const diagnosticEvidence = {
      battleTurnWorkflow: { stage: "decisionCompleted" },
    };
    deps.readDiagnosticEvidence.mockReturnValue(diagnosticEvidence);
    const detail = rejectedDetail({ error: "reload_loop" });

    expect(
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
        deps
      )
    ).toBe("reload");

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      detail,
      diagnosticEvidence,
    });
  });

  it("does not nest previous API recovery evidence inside the next recovery state", () => {
    const deps = makeDeps();
    deps.readDiagnosticEvidence.mockReturnValue({
      battleApiResponseRecovery: { repeatCount: 1 },
      battleTurnWorkflow: { stage: "decisionCompleted" },
    });
    const detail = rejectedDetail({ error: "reload_loop" });

    runBattleApiResponseRecovery(
      { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
      deps
    );

    const state = JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"));
    expect(state.diagnosticEvidence).toEqual({
      battleTurnWorkflow: { stage: "decisionCompleted" },
    });
    expect(state.diagnosticEvidence.battleApiResponseRecovery).toBeUndefined();
  });
});
