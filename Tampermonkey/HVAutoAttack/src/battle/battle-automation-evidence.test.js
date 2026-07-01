import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleAutomationEvidenceEvent,
  runBattleAutomationEvidence,
} from "./battle-automation-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleAutomationEvidence", () => {
  it("records battle page startup evidence", () => {
    expect(
      runBattleAutomationEvidence({
        type: BattleAutomationEvidenceEvent.RECORD_STARTUP,
        phase: "pageReady",
        result: true,
        steps: [{ capability: "initialBattleTurn", result: true }],
      })
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleAutomation"))).toMatchObject({
      phase: "pageReady",
      result: true,
      steps: [{ capability: "initialBattleTurn", result: true }],
      storageWriteOk: true,
    });
  });

  it("rejects null automation evidence events without writing diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleAutomationEvidence(null, { sessionStorage: window.sessionStorage, debug })
    ).toBe(false);

    expect(window.sessionStorage.getItem("HVAA:lastBattleAutomation")).toBeNull();
    expect(debug).not.toHaveBeenCalled();
  });

  it("keeps automation evidence visible when storage is unavailable", () => {
    const debug = vi.fn();

    expect(
      runBattleAutomationEvidence(
        {
          type: BattleAutomationEvidenceEvent.RECORD_STARTUP,
          phase: "pageReady",
          result: true,
          steps: [],
        },
        {
          sessionStorage: {
            setItem: vi.fn(() => {
              throw new Error("quota");
            }),
          },
          debug,
        }
      )
    ).toBe(false);

    expect(debug).toHaveBeenCalledWith(
      "[HVAA] battle automation",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });
});
