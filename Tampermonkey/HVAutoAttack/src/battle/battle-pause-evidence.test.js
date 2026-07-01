import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattlePauseEvidenceEvent, runBattlePauseEvidence } from "./battle-pause-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattlePauseEvidence", () => {
  it("records pause state evidence for diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattlePauseEvidence(
        {
          type: BattlePauseEvidenceEvent.RECORD_STATE,
          state: "paused",
          reason: "criticalBuff",
          detail: { name: "Spark of Life" },
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "paused",
      reason: "criticalBuff",
      detail: { name: "Spark of Life" },
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle pause", expect.any(Object));
  });

  it("rejects unknown pause evidence events", () => {
    expect(runBattlePauseEvidence({ type: "unknown" })).toBe(false);
    expect(runBattlePauseEvidence(null)).toBe(false);
  });
});
