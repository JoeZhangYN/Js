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
            {
              capability: "attack",
              result: { kind: "attack-plan", plan: { type: "default" } },
              acted: true,
              effectEvidence: { knownResultKind: true },
            },
          ],
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"))
    ).toMatchObject({
      steps: [
        {
          capability: "survival",
          result: { kind: "noop" },
          acted: false,
          failureReason: "noActionCandidate",
        },
        {
          capability: "attack",
          result: { kind: "attack-plan", planKind: "default" },
          acted: true,
          effect: { knownResultKind: true },
          failureReason: null,
        },
      ],
    });
    expect(debug).toHaveBeenCalledWith("[HVAA] battle action decision", expect.any(Object));
  });

  it("records per-step failure reasons when a real action candidate is rejected", () => {
    runBattleActionDecisionEvidence(
      {
        type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
        steps: [
          {
            capability: "survival",
            result: { kind: "item-plan", plan: { type: "potion" } },
            acted: false,
          },
          {
            capability: "buffPreparation",
            result: { kind: "noop", reason: "buffsReady" },
            acted: false,
          },
        ],
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"))
    ).toMatchObject({
      steps: [
        {
          capability: "survival",
          result: { kind: "item-plan", planKind: "potion" },
          acted: false,
          failureReason: "actionExecutorRejected",
        },
        {
          capability: "buffPreparation",
          result: { kind: "noop", reason: "buffsReady" },
          acted: false,
          failureReason: "buffsReady",
        },
      ],
    });
  });

  it("keeps legacy plan kind fallback for older decision evidence", () => {
    runBattleActionDecisionEvidence(
      {
        type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
        steps: [
          {
            capability: "attack",
            result: { kind: "attack-plan", plan: { kind: "target" } },
            acted: true,
          },
        ],
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"))
    ).toMatchObject({
      steps: [{ result: { kind: "attack-plan", planKind: "target" }, acted: true }],
    });
  });

  it("records event type for rejected decision events", () => {
    runBattleActionDecisionEvidence(
      {
        type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
        steps: [
          {
            capability: "actionDecision",
            result: {
              kind: "unknown-decision-event",
              reason: "unknownActionDecisionEvent",
              eventType: "unknown",
            },
            acted: false,
          },
        ],
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"))
    ).toMatchObject({
      steps: [
        {
          capability: "actionDecision",
          result: {
            kind: "unknown-decision-event",
            reason: "unknownActionDecisionEvent",
            eventType: "unknown",
          },
          acted: false,
          failureReason: "unknownActionDecisionEvent",
        },
      ],
    });
  });

  it("rejects unknown decision evidence events", () => {
    expect(runBattleActionDecisionEvidence({ type: "unknown" })).toBe(false);
  });

  it("rejects null decision evidence events without writing diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleActionDecisionEvidence(null, { sessionStorage: window.sessionStorage, debug })
    ).toBe(false);

    expect(window.sessionStorage.getItem("HVAA:lastBattleActionDecision")).toBeNull();
    expect(debug).not.toHaveBeenCalled();
  });
});
