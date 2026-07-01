import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleCommandEvidence", () => {
  it("records command result evidence for diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleCommandEvidence(
        {
          type: BattleCommandEvidenceEvent.RECORD_RESULT,
          command: "skill.clickReady",
          result: "rejected",
          reason: "skillNotReady",
          detail: { skillId: "213" },
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "rejected",
      acted: false,
      reason: "skillNotReady",
      failureReason: "skillNotReady",
      detail: { skillId: "213" },
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle command", expect.any(Object));
  });

  it("records accepted commands as acted without a failure reason", () => {
    expect(
      runBattleCommandEvidence({
        type: BattleCommandEvidenceEvent.RECORD_RESULT,
        command: "target.click",
        result: "accepted",
        reason: "clicked",
        detail: { targetId: 1 },
      })
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.click",
      result: "accepted",
      acted: true,
      reason: "clicked",
      failureReason: null,
      detail: { targetId: 1 },
    });
  });

  it("rejects unknown command evidence events", () => {
    expect(runBattleCommandEvidence({ type: "unknown" })).toBe(false);
  });

  it("rejects null command evidence events without writing diagnostics", () => {
    const debug = vi.fn();

    expect(runBattleCommandEvidence(null, { sessionStorage: window.sessionStorage, debug })).toBe(
      false
    );

    expect(window.sessionStorage.getItem("HVAA:lastBattleCommand")).toBeNull();
    expect(debug).not.toHaveBeenCalled();
  });
});
