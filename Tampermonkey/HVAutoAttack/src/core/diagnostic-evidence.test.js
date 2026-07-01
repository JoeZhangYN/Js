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
      "HVAA:lastBattleAutomation",
      JSON.stringify({ phase: "pageReady", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleLifecycle",
      JSON.stringify({ phase: "battleStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleRoundStart",
      JSON.stringify({ phase: "roundStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleKillBugRecovery",
      JSON.stringify({ result: "scheduledReload", detail: { scannedRows: 1 } })
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
      "HVAA:lastBattleActionDelay",
      JSON.stringify({ decision: "rejected", reason: "unknownActionDelayEvent" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionLifecycle",
      JSON.stringify({ phase: "actionStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionDecision",
      JSON.stringify({
        steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
      })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionEffect",
      JSON.stringify({ result: { kind: "noop" }, acted: false, knownResultKind: true })
    );

    expect(readRecentDiagnosticEvidence(window.sessionStorage)).toMatchObject({
      navigationDecision: { decision: "rejected", detail: { cause: "invalidReloadDelay" } },
      battleAutomation: { phase: "pageReady", result: true },
      battleLifecycle: { phase: "battleStarted", result: true },
      battleRoundStart: { phase: "roundStarted", result: true },
      battleKillBugRecovery: { result: "scheduledReload", detail: { scannedRows: 1 } },
      battleTurnWorkflow: { stage: "contextPrepared", detail: { hasContext: true } },
      battleApiResponseRecovery: { repeatCount: 2, detail: { responseKind: "jsonReload" } },
      battleCommand: { command: "skill.clickReady", result: "rejected", reason: "skillNotReady" },
      battlePause: { state: "paused", reason: "autoPause" },
      battleActionDelay: { decision: "rejected", reason: "unknownActionDelayEvent" },
      battleActionLifecycle: { phase: "actionStarted", result: true },
      battleActionDecision: {
        steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
      },
      battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true },
    });
  });
});
