import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleAutomationEvidenceEvent,
  runBattleAutomationEvidence,
} from "./battle-automation-evidence.js";
import {
  BattleActionDecisionEvidenceEvent,
  runBattleActionDecisionEvidence,
} from "./battle-action-decision-evidence.js";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";
import { BattlePauseEvidenceEvent, runBattlePauseEvidence } from "./battle-pause-evidence.js";
import {
  BattleTurnWorkflowEvidenceEvent,
  runBattleTurnWorkflowEvidence,
} from "./battle-turn-workflow-evidence.js";

beforeEach(() => window.sessionStorage.clear());

const debugFailureCases = [
  [
    "automation",
    runBattleAutomationEvidence,
    {
      type: BattleAutomationEvidenceEvent.RECORD_STARTUP,
      phase: "pageReady",
      result: true,
      steps: [],
    },
    "HVAA:lastBattleAutomation",
    { phase: "pageReady" },
  ],
  [
    "decision",
    runBattleActionDecisionEvidence,
    {
      type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
      steps: [{ capability: "attack", result: { kind: "noop" }, acted: false }],
    },
    "HVAA:lastBattleActionDecision",
    { steps: [expect.objectContaining({ capability: "attack" })] },
  ],
  [
    "effect",
    runBattleActionEffectEvidence,
    {
      type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
      result: { kind: "noop" },
      acted: false,
    },
    "HVAA:lastBattleActionEffect",
    { result: { kind: "noop" }, acted: false },
  ],
  [
    "command",
    runBattleCommandEvidence,
    { type: BattleCommandEvidenceEvent.RECORD_RESULT, command: "target.click", result: "accepted" },
    "HVAA:lastBattleCommand",
    { command: "target.click", result: "accepted" },
  ],
  [
    "lifecycle",
    runBattleActionLifecycleEvidence,
    {
      type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
      phase: "actionEnded",
      result: { outcome: "ongoing" },
    },
    "HVAA:lastBattleActionLifecycle",
    { phase: "actionEnded" },
  ],
  [
    "turn",
    runBattleTurnWorkflowEvidence,
    {
      type: BattleTurnWorkflowEvidenceEvent.RECORD_STAGE,
      stage: "decisionCompleted",
      detail: { acted: false },
    },
    "HVAA:lastBattleTurnWorkflow",
    { stage: "decisionCompleted" },
  ],
  [
    "pause",
    runBattlePauseEvidence,
    {
      type: BattlePauseEvidenceEvent.RECORD_STATE,
      state: "paused",
      reason: "battleApiResponseRepeated",
    },
    "HVAA:lastBattlePause",
    { state: "paused" },
  ],
];

describe("battle action evidence debug output failures", () => {
  it("does not throw when evidence debug output fails for every action evidence entry", () => {
    for (const [label, run, event, key, expected] of debugFailureCases) {
      const deps = {
        sessionStorage: window.sessionStorage,
        debug: vi.fn(() => {
          throw new Error("console blocked");
        }),
      };
      let result;

      expect(() => {
        result = run(event, deps);
      }, label).not.toThrow();
      expect(result, label).toBe(true);
      expect(JSON.parse(window.sessionStorage.getItem(key))).toMatchObject({
        ...expected,
        storageWriteOk: true,
      });
      window.sessionStorage.clear();
    }
  });
});
