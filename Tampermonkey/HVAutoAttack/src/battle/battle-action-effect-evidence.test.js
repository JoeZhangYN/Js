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

  it("rejects unknown evidence events", () => {
    expect(runBattleActionEffectEvidence({ type: "unknown" })).toBe(false);
  });
});
