import { describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

describe("battle action effect recording fallback evidence", () => {
  it("preserves recording failure reason for acted fallback evidence", () => {
    runBattleActionEffectEvidence(
      {
        type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
        result: {
          kind: "effect-evidence-event",
          reason: "actionEffectEvidenceWriteFailed",
          originalResultKind: "skill-command",
          error: "effect evidence failed",
        },
        acted: true,
        knownResultKind: true,
        failureReason: "actionEffectEvidenceWriteFailed",
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: {
        kind: "effect-evidence-event",
        reason: "actionEffectEvidenceWriteFailed",
        originalResultKind: "skill-command",
        error: "effect evidence failed",
      },
      acted: true,
      knownResultKind: true,
      failureReason: "actionEffectEvidenceWriteFailed",
    });
  });
});
