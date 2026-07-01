import { describe, expect, it, vi } from "vitest";
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

function failingDeps() {
  return {
    sessionStorage: {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    },
    debug: vi.fn(),
  };
}

describe("battle action evidence persistence failures", () => {
  it("keeps decision evidence visible when storage is unavailable", () => {
    const deps = failingDeps();

    expect(
      runBattleActionDecisionEvidence(
        {
          type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
          steps: [{ capability: "attack", result: { kind: "noop" }, acted: false }],
        },
        deps
      )
    ).toBe(false);

    expect(deps.debug).toHaveBeenCalledWith(
      "[HVAA] battle action decision",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps effect evidence visible when storage is unavailable", () => {
    const deps = failingDeps();

    expect(
      runBattleActionEffectEvidence(
        {
          type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
          result: { kind: "noop" },
          acted: false,
        },
        deps
      )
    ).toBe(false);

    expect(deps.debug).toHaveBeenCalledWith(
      "[HVAA] battle action effect",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps command evidence visible when storage is unavailable", () => {
    const deps = failingDeps();

    expect(
      runBattleCommandEvidence(
        {
          type: BattleCommandEvidenceEvent.RECORD_RESULT,
          command: "target.click",
          result: "rejected",
          reason: "targetDead",
        },
        deps
      )
    ).toBe(false);

    expect(deps.debug).toHaveBeenCalledWith(
      "[HVAA] battle command",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps lifecycle evidence visible when storage is unavailable", () => {
    const deps = failingDeps();

    expect(
      runBattleActionLifecycleEvidence(
        {
          type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
          phase: "actionEnded",
          result: { outcome: "ongoing" },
        },
        deps
      )
    ).toBe(false);

    expect(deps.debug).toHaveBeenCalledWith(
      "[HVAA] battle action lifecycle",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps turn workflow evidence visible when storage is unavailable", () => {
    const deps = failingDeps();

    expect(
      runBattleTurnWorkflowEvidence(
        {
          type: BattleTurnWorkflowEvidenceEvent.RECORD_STAGE,
          stage: "decisionCompleted",
          detail: { acted: false },
        },
        deps
      )
    ).toBe(false);

    expect(deps.debug).toHaveBeenCalledWith(
      "[HVAA] battle turn workflow",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps pause evidence visible when storage is unavailable", () => {
    const deps = failingDeps();

    expect(
      runBattlePauseEvidence(
        {
          type: BattlePauseEvidenceEvent.RECORD_STATE,
          state: "paused",
          reason: "battleApiResponseRepeated",
        },
        deps
      )
    ).toBe(false);

    expect(deps.debug).toHaveBeenCalledWith(
      "[HVAA] battle pause",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });
});
