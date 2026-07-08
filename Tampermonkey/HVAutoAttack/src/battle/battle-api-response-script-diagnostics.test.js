import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { buildApiResponseScript } from "./battle-api-response-script.js";

function installApiResponse() {
  Function(
    `${buildApiResponseScript({ world: "persistent", apiJsonUrl: "https://hv/json" })}; window.__testApiResponse = api_response;`
  )();
  return window.__testApiResponse;
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.HVAA_battleApiRecovery;
  delete window.__testApiResponse;
});

describe("battle API response script diagnostics", () => {
  it("carries recent diagnostic evidence into bridge-missing recovery state", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const apiResponse = installApiResponse();
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_DECISION,
      JSON.stringify({
        steps: [{ capability: "attack", acted: false, failureReason: "actionExecutorRejected" }],
      })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT,
      JSON.stringify({ result: { kind: "attack-plan" }, acted: false })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_COMPLETION,
      JSON.stringify({ outcome: "ongoing", reason: "unknownCompletionEvent" })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_API_BRIDGE,
      JSON.stringify({ phase: "start", result: "rejected", reason: "eventNodeMissing" })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_DELAY,
      JSON.stringify({ decision: "rejected", reason: "unknownActionDelayEvent" })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_SPEED,
      JSON.stringify({ decision: "rejected", reason: "unknownActionSpeedEvent" })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY,
      JSON.stringify({ repeatCount: 99 })
    );

    expect(
      apiResponse({
        readyState: 4,
        status: 200,
        responseText: JSON.stringify({ error: "server_error" }),
      })
    ).toBe(false);

    const state = JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"));
    expect(state).toMatchObject({
      recoveryAction: "bridgeMissing",
      diagnosticEvidence: {
        battleCompletion: { outcome: "ongoing", reason: "unknownCompletionEvent" },
        battleApiBridge: { phase: "start", result: "rejected", reason: "eventNodeMissing" },
        battleActionDelay: { decision: "rejected", reason: "unknownActionDelayEvent" },
        battleActionSpeed: { decision: "rejected", reason: "unknownActionSpeedEvent" },
      },
    });
    expect(state.diagnosticEvidence.battleApiResponseRecovery).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery bridge missing; reload blocked",
      expect.any(Object)
    );
  });
});
