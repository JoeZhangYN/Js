import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle action effect exception evidence", () => {
  it("records executor exceptions as structured failure detail", () => {
    runBattleActionEffectEvidence(
      {
        type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
        result: { kind: "attack-plan", plan: { type: "default" } },
        acted: false,
        knownResultKind: true,
        failureReason: "actionExecutorThrew",
        executionError: "executor exploded",
      },
      { sessionStorage: window.sessionStorage, debug: vi.fn() }
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "attack-plan", planKind: "default" },
      acted: false,
      failureReason: "actionExecutorThrew",
      executionError: "executor exploded",
    });
  });
});
