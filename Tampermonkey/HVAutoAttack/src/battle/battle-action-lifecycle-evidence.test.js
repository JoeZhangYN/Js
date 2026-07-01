import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleActionLifecycleEvidence", () => {
  it("records action lifecycle phase and result for diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleActionLifecycleEvidence(
        {
          type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
          phase: "actionEnded",
          result: { outcome: "ongoing", continued: "turn" },
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionLifecycle"))).toMatchObject({
      phase: "actionEnded",
      result: { outcome: "ongoing", continued: "turn" },
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle action lifecycle", expect.any(Object));
  });

  it("rejects unknown lifecycle evidence events", () => {
    expect(runBattleActionLifecycleEvidence({ type: "unknown" })).toBe(false);
  });
});
