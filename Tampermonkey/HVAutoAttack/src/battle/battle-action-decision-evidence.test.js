import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionDecisionEvidenceEvent,
  runBattleActionDecisionEvidence,
} from "./battle-action-decision-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleActionDecisionEvidence", () => {
  it("records decision trace with acted and not-acted steps", () => {
    const debug = vi.fn();

    expect(
      runBattleActionDecisionEvidence(
        {
          type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
          steps: [
            { capability: "survival", result: { kind: "noop" }, acted: false },
            { capability: "attack", result: { kind: "attack-plan", plan: { type: "default" } }, acted: true },
          ],
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"))).toMatchObject({
      steps: [
        { capability: "survival", result: { kind: "noop" }, acted: false },
        { capability: "attack", result: { kind: "attack-plan", planKind: "default" }, acted: true },
      ],
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle action decision", expect.any(Object));
  });

  it("keeps legacy plan kind fallback for older decision evidence", () => {
    runBattleActionDecisionEvidence(
      {
        type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
        steps: [{ capability: "attack", result: { kind: "attack-plan", plan: { kind: "target" } }, acted: true }],
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"))).toMatchObject({
      steps: [{ result: { kind: "attack-plan", planKind: "target" }, acted: true }],
    });
  });

  it("rejects unknown decision evidence events", () => {
    expect(runBattleActionDecisionEvidence({ type: "unknown" })).toBe(false);
  });
});
