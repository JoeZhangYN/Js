import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { buildApiResponseScript } from "./battle-api-response-script.js";

function installApiResponse(worldContext = { world: "persistent", apiJsonUrl: "https://hv/json" }) {
  Function(`${buildApiResponseScript(worldContext)}; window.__testApiResponse = api_response;`)();
  return window.__testApiResponse;
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.HVAA_battleApiRecovery;
  delete window.__testApiResponse;
  delete window.info;
});

describe("buildApiResponseScript", () => {
  it("records blocked recovery evidence when the page bridge is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const apiResponse = installApiResponse({ world: "isekai", apiJsonUrl: "https://hv/isekai/json" });
    window.info = { mode: "magic", skill: 213, target: 2 };

    expect(
      apiResponse({
        readyState: 4,
        status: 200,
        responseText: JSON.stringify({ reload: true }),
      })
    ).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "bridgeMissing",
      detail: {
        responseKind: "jsonReload",
        status: 200,
        reload: true,
        world: { world: "isekai", apiJsonUrl: "https://hv/isekai/json" },
        action: { mode: "magic", skill: 213, target: 2 },
      },
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery bridge missing; reload blocked",
      expect.any(Object)
    );
  });

  it("carries recent diagnostic evidence into bridge-missing recovery state", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const apiResponse = installApiResponse();
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_DECISION,
      JSON.stringify({
        steps: [
          {
            capability: "attack",
            result: { kind: "attack-plan", planKind: "default" },
            acted: false,
            failureReason: "actionExecutorRejected",
          },
        ],
      })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT,
      JSON.stringify({
        result: { kind: "attack-plan", planKind: "default" },
        acted: false,
        failureReason: "actionExecutorRejected",
      })
    );
    window.sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_DELAY,
      JSON.stringify({
        decision: "rejected",
        reason: "unknownActionDelayEvent",
        eventType: null,
      })
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

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      recoveryAction: "bridgeMissing",
      diagnosticEvidence: {
        battleActionDecision: {
          steps: [
            {
              capability: "attack",
              acted: false,
              failureReason: "actionExecutorRejected",
            },
          ],
        },
        battleActionEffect: {
          result: { kind: "attack-plan", planKind: "default" },
          acted: false,
          failureReason: "actionExecutorRejected",
        },
        battleActionDelay: {
          decision: "rejected",
          reason: "unknownActionDelayEvent",
          eventType: null,
        },
      },
    });
    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery")).diagnosticEvidence
        .battleApiResponseRecovery
    ).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery bridge missing; reload blocked",
      expect.any(Object)
    );
  });

  it("routes rejected API responses through the recovery bridge when available", () => {
    const handleRejectedResponse = vi.fn();
    const apiResponse = installApiResponse();
    window.HVAA_battleApiRecovery = { handleRejectedResponse };

    expect(
      apiResponse({
        readyState: 4,
        status: 500,
        responseText: "",
      })
    ).toBe(false);

    expect(handleRejectedResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        responseKind: "httpStatus",
        status: 500,
        world: { world: "persistent", apiJsonUrl: "https://hv/json" },
      })
    );
    expect(window.sessionStorage.getItem("HVAA:battleApiRecovery")).toBeNull();
  });
});
