import { beforeEach, describe, expect, it } from "vitest";
import { readRecentDiagnosticEvidence } from "./diagnostic-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("readRecentDiagnosticEvidence", () => {
  it("returns lifecycle, decision, and effect evidence together", () => {
    window.sessionStorage.setItem(
      "HVAA:lastNavigationDecision",
      JSON.stringify({ decision: "rejected", detail: { cause: "invalidReloadDelay" } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleTurnWorkflow",
      JSON.stringify({ stage: "contextPrepared", detail: { hasContext: true } })
    );
    window.sessionStorage.setItem(
      "HVAA:battleApiRecovery",
      JSON.stringify({ repeatCount: 2, detail: { responseKind: "jsonReload" } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleCommand",
      JSON.stringify({ command: "skill.clickReady", result: "rejected", reason: "skillNotReady" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattlePause",
      JSON.stringify({ state: "paused", reason: "autoPause" })
    );
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
      navigationDecision: { decision: "rejected", detail: { cause: "invalidReloadDelay" } },
      battleTurnWorkflow: { stage: "contextPrepared", detail: { hasContext: true } },
      battleApiResponseRecovery: { repeatCount: 2, detail: { responseKind: "jsonReload" } },
      battleCommand: { command: "skill.clickReady", result: "rejected", reason: "skillNotReady" },
      battlePause: { state: "paused", reason: "autoPause" },
      battleActionLifecycle: { phase: "actionStarted", result: true },
      battleActionDecision: { steps: [{ capability: "attack", acted: false }] },
      battleActionEffect: { result: { kind: "noop" }, acted: false },
    });
  });
});
