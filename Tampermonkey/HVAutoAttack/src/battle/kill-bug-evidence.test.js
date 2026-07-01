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

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))).toMatchObject({
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
});
