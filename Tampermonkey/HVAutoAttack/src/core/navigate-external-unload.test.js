import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";
import "./navigate.js";

describe("navigation external unload audit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("records page unloads that bypass the navigation entry", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_DECISION,
      JSON.stringify({ steps: [{ capability: "attack", acted: false }] })
    );
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT,
      JSON.stringify({ result: { kind: "noop" }, acted: false })
    );

    window.dispatchEvent(new Event("pagehide"));

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] externalUnload",
      expect.objectContaining({
        kind: "externalUnload",
        reason: "outsideNavigationEntry",
        eventType: "pagehide",
        diagnosticEvidence: {
          battleActionDecision: { steps: [{ capability: "attack", acted: false }] },
          battleActionEffect: { result: { kind: "noop" }, acted: false },
        },
      })
    );
    expect(JSON.parse(sessionStorage.getItem(DiagnosticEvidenceKey.NAVIGATION_AUDIT))).toMatchObject({
      kind: "externalUnload",
      reason: "outsideNavigationEntry",
      eventType: "pagehide",
      diagnosticEvidence: {
        battleActionDecision: { steps: [{ capability: "attack", acted: false }] },
        battleActionEffect: { result: { kind: "noop" }, acted: false },
      },
    });
  });
});
