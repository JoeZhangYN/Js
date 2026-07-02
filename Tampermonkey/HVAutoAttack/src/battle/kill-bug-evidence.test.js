import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleKillBugEvidenceEvent, runBattleKillBugEvidence } from "./kill-bug-evidence.js";

describe("runBattleKillBugEvidence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("records battle kill-bug recovery evidence", () => {
    const debug = vi.fn();

    expect(
      runBattleKillBugEvidence(
        {
          type: BattleKillBugEvidenceEvent.RECORD_RECOVERY,
          result: "scheduledReload",
          reason: "recover",
          detail: { matchedTexts: ["Inventory slot is empty"], delayMs: 700 },
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))
    ).toMatchObject({
      result: "scheduledReload",
      reason: "recover",
      detail: { matchedTexts: ["Inventory slot is empty"], delayMs: 700 },
      storageWriteOk: true,
    });
  });

  it("rejects null kill-bug evidence events without writing diagnostics", () => {
    expect(runBattleKillBugEvidence(null)).toBe(false);
    expect(window.sessionStorage.getItem("HVAA:lastBattleKillBugRecovery")).toBeNull();
  });

  it("keeps kill-bug recovery evidence visible when storage is unavailable", () => {
    const debug = vi.fn();
    const blockedStorage = {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(
      runBattleKillBugEvidence(
        {
          type: BattleKillBugEvidenceEvent.RECORD_RECOVERY,
          result: "reloadAttempted",
          reason: "recover",
          detail: { matchedText: "Item does not exist", navigationResult: false },
        },
        { sessionStorage: blockedStorage, debug }
      )
    ).toBe(false);

    expect(debug).toHaveBeenCalledWith(
      "[HVAA] battle kill bug recovery",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps kill-bug recovery evidence stored when debug output fails", () => {
    expect(() =>
      runBattleKillBugEvidence(
        {
          type: BattleKillBugEvidenceEvent.RECORD_RECOVERY,
          result: "notMatched",
          reason: "recover",
          detail: { matchedTexts: [], scannedRows: 1, delayMs: null },
        },
        {
          sessionStorage: window.sessionStorage,
          debug: () => {
            throw new Error("console blocked");
          },
        }
      )
    ).not.toThrow();

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))
    ).toMatchObject({
      result: "notMatched",
      reason: "recover",
      storageWriteOk: true,
    });
  });
});
