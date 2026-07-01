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
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle turn workflow", expect.any(Object));
  });

  it("rejects unknown turn workflow evidence events", () => {
    expect(runBattleTurnWorkflowEvidence({ type: "unknown" })).toBe(false);
    expect(runBattleTurnWorkflowEvidence(null)).toBe(false);
  });
});
