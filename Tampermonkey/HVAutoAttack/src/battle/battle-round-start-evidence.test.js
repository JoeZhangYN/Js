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

  it("keeps round-start evidence visible when storage is unavailable", () => {
    const debug = vi.fn();
    const blockedStorage = {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(
      runBattleRoundStartEvidence(
        {
          type: BattleRoundStartEvidenceEvent.RECORD_ROUND_START,
          phase: "roundReady",
          result: false,
          steps: [{ step: "monsterStatusReady", result: false }],
        },
        { sessionStorage: blockedStorage, debug }
      )
    ).toBe(false);

    expect(debug).toHaveBeenCalledWith(
      "[HVAA] battle round start",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps round-start evidence stored when debug output fails", () => {
    expect(() =>
      runBattleRoundStartEvidence(
        {
          type: BattleRoundStartEvidenceEvent.RECORD_ROUND_START,
          phase: "roundStarted",
          result: true,
          steps: [{ step: "roundStarted", result: true }],
        },
        {
          sessionStorage: window.sessionStorage,
          debug: () => {
            throw new Error("console blocked");
          },
        }
      )
    ).not.toThrow();

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "roundStarted",
      result: true,
      storageWriteOk: true,
    });
  });
});
