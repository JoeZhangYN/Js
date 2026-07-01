import { describe, expect, it, vi } from "vitest";
import {
  BattleActionDecisionEvidenceEvent,
  runBattleActionDecisionEvidence,
} from "./battle-action-decision-evidence.js";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

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
});
