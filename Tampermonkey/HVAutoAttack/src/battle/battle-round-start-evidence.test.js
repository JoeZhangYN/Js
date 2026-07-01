import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleRoundStartEvidenceEvent,
  runBattleRoundStartEvidence,
} from "./battle-round-start-evidence.js";

describe("runBattleRoundStartEvidence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("records battle round-start evidence", () => {
    const debug = vi.fn();

    expect(
      runBattleRoundStartEvidence(
        {
          type: BattleRoundStartEvidenceEvent.RECORD_ROUND_START,
          phase: "roundStarted",
          result: true,
          steps: [{ step: "roundReady", result: true }],
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "roundStarted",
      result: true,
      steps: [{ step: "roundReady", result: true }],
      storageWriteOk: true,
    });
  });

  it("rejects null round-start evidence events without writing diagnostics", () => {
    expect(runBattleRoundStartEvidence(null)).toBe(false);
    expect(window.sessionStorage.getItem("HVAA:lastBattleRoundStart")).toBeNull();
  });
});
