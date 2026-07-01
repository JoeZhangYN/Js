import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleActionEffectEvidence", () => {
  it("records acted action effect evidence for diagnostics", () => {
    const debug = vi.fn();

    expect(
      runBattleActionEffectEvidence(
        {
          type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
          result: { kind: "click-skill-then-target", skillId: "213", targetId: 2 },
          acted: true,
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "click-skill-then-target", skillId: "213", targetId: 2 },
      acted: true,
    });
    expect(debug).toHaveBeenCalledWith(
      "[HVAA] battle action effect",
      expect.objectContaining({ acted: true })
    );
  });

  it("records not-acted effect evidence so empty turns are diagnosable", () => {
    runBattleActionEffectEvidence(
      {
        type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
        result: { kind: "noop", reason: "noCandidate" },
        acted: false,
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "noop", reason: "noCandidate" },
      acted: false,
    });
  });

  it("records event type for rejected dispatch events", () => {
    runBattleActionEffectEvidence(
      {
        type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
        result: {
          kind: "unknown-dispatch-event",
          reason: "unknownActionEffectDispatchEvent",
          eventType: "unknown",
        },
        acted: false,
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: {
        kind: "unknown-dispatch-event",
        reason: "unknownActionEffectDispatchEvent",
        eventType: "unknown",
      },
      acted: false,
    });
  });

  it("records real plan type for plan action results", () => {
    runBattleActionEffectEvidence(
      {
        type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
        result: { kind: "attack-plan", plan: { type: "focus" } },
        acted: false,
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "attack-plan", planKind: "focus" },
      acted: false,
    });
  });

  it("keeps legacy plan kind fallback for older evidence producers", () => {
    runBattleActionEffectEvidence(
      {
        type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
        result: { kind: "attack-plan", plan: { kind: "target" } },
        acted: true,
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "attack-plan", planKind: "target" },
    });
  });

  it("rejects unknown evidence events", () => {
    expect(runBattleActionEffectEvidence({ type: "unknown" })).toBe(false);
  });

  it("rejects null effect evidence events without writing diagnostics", () => {
    const debug = vi.fn();

    expect(runBattleActionEffectEvidence(null, { sessionStorage: window.sessionStorage, debug })).toBe(
      false
    );

    expect(window.sessionStorage.getItem("HVAA:lastBattleActionEffect")).toBeNull();
    expect(debug).not.toHaveBeenCalled();
  });
});
