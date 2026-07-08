import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";
import { writeNavigationAudit } from "./navigation-audit.js";
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
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_COMPLETION,
      JSON.stringify({ outcome: "victory", effects: { scheduleReload: false } })
    );
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_API_BRIDGE,
      JSON.stringify({ phase: "start", result: "rejected", reason: "eventNodeMissing" })
    );
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_DELAY,
      JSON.stringify({ decision: "rejected", reason: "unknownActionDelayEvent", eventType: null })
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
          battleCompletion: { outcome: "victory", effects: { scheduleReload: false } },
          battleApiBridge: { phase: "start", result: "rejected", reason: "eventNodeMissing" },
          battleActionDelay: {
            decision: "rejected",
            reason: "unknownActionDelayEvent",
            eventType: null,
          },
        },
      })
    );
    expect(
      JSON.parse(sessionStorage.getItem(DiagnosticEvidenceKey.NAVIGATION_AUDIT))
    ).toMatchObject({
      kind: "externalUnload",
      reason: "outsideNavigationEntry",
      eventType: "pagehide",
      diagnosticEvidence: {
        battleActionDecision: {
          steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
        },
        battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true },
        battleCompletion: { outcome: "victory", effects: { scheduleReload: false } },
        battleApiBridge: { phase: "start", result: "rejected", reason: "eventNodeMissing" },
        battleActionDelay: {
          decision: "rejected",
          reason: "unknownActionDelayEvent",
          eventType: null,
        },
      },
    });
  });

  it("warns about external unloads even when navigation audit storage is unavailable", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const getItem = vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("read blocked");
    });
    const setItem = vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
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
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("keeps external unload audit stored when console warning is unavailable", () => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() => window.dispatchEvent(new Event("pagehide"))).not.toThrow();

    expect(
      JSON.parse(sessionStorage.getItem(DiagnosticEvidenceKey.NAVIGATION_AUDIT))
    ).toMatchObject({
      kind: "externalUnload",
      reason: "outsideNavigationEntry",
      eventType: "pagehide",
      storageWriteOk: true,
    });
  });

  it("does not nest previous navigation audit into a new navigation audit", () => {
    sessionStorage.setItem(
      DiagnosticEvidenceKey.NAVIGATION_AUDIT,
      JSON.stringify({ kind: "previousReload" })
    );
    sessionStorage.setItem(
      DiagnosticEvidenceKey.BATTLE_COMPLETION,
      JSON.stringify({ outcome: "victory" })
    );

    writeNavigationAudit("reload", { reason: "battleApiResponse" });

    const audit = JSON.parse(sessionStorage.getItem(DiagnosticEvidenceKey.NAVIGATION_AUDIT));
    expect(audit.diagnosticEvidence).toMatchObject({
      battleCompletion: { outcome: "victory" },
    });
    expect(audit.diagnosticEvidence).not.toHaveProperty("navigationAudit");
  });
});
