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
      JSON.stringify({
        steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
      })
    );
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT,
      JSON.stringify({ result: { kind: "noop" }, acted: false, knownResultKind: true })
    );

    window.dispatchEvent(new Event("pagehide"));

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] externalUnload",
      expect.objectContaining({
        kind: "externalUnload",
        reason: "outsideNavigationEntry",
        eventType: "pagehide",
        diagnosticEvidence: {
          battleActionDecision: {
            steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
          },
          battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true },
        },
      })
    );
    expect(JSON.parse(sessionStorage.getItem(DiagnosticEvidenceKey.NAVIGATION_AUDIT))).toMatchObject({
      kind: "externalUnload",
      reason: "outsideNavigationEntry",
      eventType: "pagehide",
      diagnosticEvidence: {
        battleActionDecision: {
          steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
        },
        battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true },
      },
    });
  });

  it("warns about external unloads even when navigation audit storage is unavailable", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("read blocked");
    });
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("write blocked");
    });

    window.dispatchEvent(new Event("pagehide"));

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] externalUnload",
      expect.objectContaining({
        kind: "externalUnload",
        reason: "outsideNavigationEntry",
        eventType: "pagehide",
        storageWriteOk: false,
        storageWriteError: "write blocked",
      })
    );
  });
});
