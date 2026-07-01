import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

function recordPlanFailure(kind, planType) {
  runBattleActionEffectEvidence(
    {
      type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
      result: { kind, plan: { type: planType } },
      acted: false,
    },
    { sessionStorage: window.sessionStorage, debug: vi.fn() }
  );
  return JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"));
}

describe("battle action effect plan failure evidence", () => {
  it("classifies unknown attack, item, and channel plan types", () => {
    expect(recordPlanFailure("attack-plan", "unexpected")).toMatchObject({
      result: { kind: "attack-plan", planKind: "unexpected" },
      failureReason: "unknownAttackPlanType",
    });
    expect(recordPlanFailure("item-plan", "unexpected")).toMatchObject({
      result: { kind: "item-plan", planKind: "unexpected" },
      failureReason: "unknownItemPlanType",
    });
    expect(recordPlanFailure("channel-plan", "unexpected")).toMatchObject({
      result: { kind: "channel-plan", planKind: "unexpected" },
      failureReason: "unknownChannelPlanType",
    });
  });
});
