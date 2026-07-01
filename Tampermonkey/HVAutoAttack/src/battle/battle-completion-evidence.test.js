import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleCompletionEvidenceEvent,
  runBattleCompletionEvidence,
} from "./battle-completion-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleCompletionEvidence", () => {
  it("records completion outcome evidence for diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleCompletionEvidence(
        {
          type: BattleCompletionEvidenceEvent.RECORD_COMPLETION,
          outcome: "victory",
          context: { monsterAlive: 0, roundNow: 2, roundAll: 2 },
          effects: { recordCompletion: true, scheduleReload: false },
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleCompletion"))).toMatchObject({
      outcome: "victory",
      context: { monsterAlive: 0, roundNow: 2, roundAll: 2 },
      effects: { recordCompletion: true, scheduleReload: false },
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle completion", expect.any(Object));
  });

  it("rejects null completion evidence events without writing diagnostics", () => {
    const debug = vi.fn();

    expect(runBattleCompletionEvidence(null, { sessionStorage: window.sessionStorage, debug })).toBe(
      false
    );

    expect(window.sessionStorage.getItem("HVAA:lastBattleCompletion")).toBeNull();
    expect(debug).not.toHaveBeenCalled();
  });

  it("keeps completion evidence visible when storage is unavailable", () => {
    const debug = vi.fn();
    const blockedStorage = { setItem: () => { throw new Error("quota"); } };

    expect(
      runBattleCompletionEvidence(
        {
          type: BattleCompletionEvidenceEvent.RECORD_COMPLETION,
          outcome: "ongoing",
          reason: "unknownCompletionEvent",
          eventType: null,
        },
        { sessionStorage: blockedStorage, debug }
      )
    ).toBe(false);

    expect(debug).toHaveBeenCalledWith(
      "[HVAA] battle completion",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });
});
