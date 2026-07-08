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

const storageFailureCases = [
  [
    "keeps automation evidence visible when storage is unavailable",
    runBattleAutomationEvidence,
    {
      type: BattleAutomationEvidenceEvent.RECORD_STARTUP,
      phase: "pageReady",
      result: true,
      steps: [],
    },
    "[HVAA] battle automation",
  ],
  [
    "keeps decision evidence visible when storage is unavailable",
    runBattleActionDecisionEvidence,
    {
      type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
      steps: [{ capability: "attack", result: { kind: "noop" }, acted: false }],
    },
    "[HVAA] battle action decision",
  ],
  [
    "keeps effect evidence visible when storage is unavailable",
    runBattleActionEffectEvidence,
    {
      type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
      result: { kind: "noop" },
      acted: false,
    },
    "[HVAA] battle action effect",
  ],
  [
    "keeps command evidence visible when storage is unavailable",
    runBattleCommandEvidence,
    {
      type: BattleCommandEvidenceEvent.RECORD_RESULT,
      command: "target.click",
      result: "rejected",
      reason: "targetDead",
    },
    "[HVAA] battle command",
  ],
  [
    "keeps lifecycle evidence visible when storage is unavailable",
    runBattleActionLifecycleEvidence,
    {
      type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
      phase: "actionEnded",
      result: { outcome: "ongoing" },
    },
    "[HVAA] battle action lifecycle",
  ],
  [
    "keeps turn workflow evidence visible when storage is unavailable",
    runBattleTurnWorkflowEvidence,
    {
      type: BattleTurnWorkflowEvidenceEvent.RECORD_STAGE,
      stage: "decisionCompleted",
      detail: { acted: false },
    },
    "[HVAA] battle turn workflow",
  ],
  [
    "keeps pause evidence visible when storage is unavailable",
    runBattlePauseEvidence,
    {
      type: BattlePauseEvidenceEvent.RECORD_STATE,
      state: "paused",
      reason: "battleApiResponseRepeated",
    },
    "[HVAA] battle pause",
  ],
];

describe("battle action evidence persistence failures", () => {
  it.each(storageFailureCases)("%s", (_name, run, event, label) => {
    const deps = {
      sessionStorage: {
        setItem: vi.fn(() => {
          throw new Error("quota");
        }),
      },
      debug: vi.fn(),
    };

    expect(run(event, deps)).toBe(false);
    expect(deps.debug).toHaveBeenCalledWith(
      label,
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });
});
