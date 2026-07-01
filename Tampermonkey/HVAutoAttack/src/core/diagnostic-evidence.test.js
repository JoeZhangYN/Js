import { beforeEach, describe, expect, it } from "vitest";
import { readRecentDiagnosticEvidence } from "./diagnostic-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("readRecentDiagnosticEvidence", () => {
  it("returns lifecycle, decision, and effect evidence together", () => {
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionLifecycle",
      JSON.stringify({ phase: "actionStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionDecision",
      JSON.stringify({ steps: [{ capability: "attack", acted: false }] })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionEffect",
      JSON.stringify({ result: { kind: "noop" }, acted: false })
    );

    expect(readRecentDiagnosticEvidence(window.sessionStorage)).toMatchObject({
      battleActionLifecycle: { phase: "actionStarted", result: true },
      battleActionDecision: { steps: [{ capability: "attack", acted: false }] },
      battleActionEffect: { result: { kind: "noop" }, acted: false },
    });
  });
});
