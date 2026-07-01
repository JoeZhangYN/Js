import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleTurnWorkflowEvidenceEvent,
  runBattleTurnWorkflowEvidence,
} from "./battle-turn-workflow-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleTurnWorkflowEvidence", () => {
  it("records turn workflow stage evidence for diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleTurnWorkflowEvidence(
        {
          type: BattleTurnWorkflowEvidenceEvent.RECORD_STAGE,
          stage: "contextPrepared",
          detail: { hasContext: true },
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleTurnWorkflow"))).toMatchObject({
      stage: "contextPrepared",
      detail: { hasContext: true },
      storageWriteOk: true,
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle turn workflow", expect.any(Object));
  });

  it("keeps turn workflow evidence stored when debug output fails", () => {
    expect(() =>
      runBattleTurnWorkflowEvidence(
        {
          type: BattleTurnWorkflowEvidenceEvent.RECORD_STAGE,
          stage: "decisionCompleted",
          detail: { acted: true },
        },
        {
          sessionStorage: window.sessionStorage,
          debug: () => {
            throw new Error("console blocked");
          },
        }
      )
    ).not.toThrow();

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleTurnWorkflow"))).toMatchObject({
      stage: "decisionCompleted",
      detail: { acted: true },
      storageWriteOk: true,
    });
  });

  it("rejects unknown turn workflow evidence events", () => {
    expect(runBattleTurnWorkflowEvidence({ type: "unknown" })).toBe(false);
    expect(runBattleTurnWorkflowEvidence(null)).toBe(false);
  });
});
