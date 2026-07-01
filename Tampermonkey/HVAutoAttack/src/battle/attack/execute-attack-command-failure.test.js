import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  runBattleFocusCommand: vi.fn(),
  runBattleTargetCommand: vi.fn(),
  runPhysicalSkillBookkeeping: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runBattleActionEffectEvidence: vi.fn(),
}));

vi.mock("../battle-focus-command.js", () => ({
  BattleFocusCommandEvent: Object.freeze({ CLICK: "click" }),
  runBattleFocusCommand: mocks.runBattleFocusCommand,
}));
vi.mock("../battle-target-command.js", () => ({
  BattleTargetCommandEvent: Object.freeze({
    CLICK_TARGET: "clickTarget",
    TRY_SKILL_THEN_TARGET: "trySkillThenTarget",
  }),
  runBattleTargetCommand: mocks.runBattleTargetCommand,
}));
vi.mock("./physical-skill-bookkeeping.js", () => ({
  PhysicalSkillBookkeepingEvent: Object.freeze({ RECORD_FIRE: "recordFire" }),
  runPhysicalSkillBookkeeping: mocks.runPhysicalSkillBookkeeping,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ CLICK_AND_RECORD: "clickAndRecord" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: Object.freeze({ RECORD_APPLIED: "recordApplied" }),
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

function applyPlan(plan) {
  return runBattleAttackExecution({
    type: BattleAttackExecutionEvent.APPLY_PLAN,
    plan,
    snap: {},
  });
}

describe("runBattleAttackExecution command failures", () => {
  it("records Focus command exceptions as not acted attack execution evidence", () => {
    mocks.runBattleFocusCommand.mockImplementation(() => {
      throw new Error("focus bridge failed");
    });

    expect(applyPlan({ type: "focus" })).toBe(false);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith({
      type: "recordApplied",
      result: {
        kind: "attack-execution-event",
        reason: "attackSubCommandThrew",
        planType: "focus",
      },
      acted: false,
      knownResultKind: true,
      failureReason: "attackSubCommandThrew",
      executionError: "focus bridge failed",
    });
  });

  it("records Spirit command exceptions as not acted attack execution evidence", () => {
    mocks.runBattleSpiritToggleAutomation.mockImplementation(() => {
      throw new Error("spirit bridge failed");
    });

    expect(applyPlan({ type: "toggle-spirit" })).toBe(false);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          kind: "attack-execution-event",
          reason: "attackSubCommandThrew",
          planType: "toggle-spirit",
        },
        executionError: "spirit bridge failed",
      })
    );
  });

  it("records target command exceptions as not acted attack execution evidence", () => {
    mocks.runBattleTargetCommand.mockImplementation(() => {
      throw new Error("target bridge failed");
    });

    expect(applyPlan({ type: "default", targetId: 3 })).toBe(false);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          kind: "attack-execution-event",
          reason: "attackSubCommandThrew",
          planType: "default",
        },
        executionError: "target bridge failed",
      })
    );
  });
});
