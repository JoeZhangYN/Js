import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemExecutionEvent, runBattleItemExecution } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  runAutoTuneAutomation: vi.fn(),
  runBattleFocusCommand: vi.fn(),
  runBattleItemCommand: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runRecoveryLearningAutomation: vi.fn(),
  runBattleActionEffectEvidence: vi.fn(),
}));

vi.mock("../../state/auto-tune.js", () => ({
  AutoTuneEvent: Object.freeze({ RECORD_POTION_USE: "recordPotionUse" }),
  runAutoTuneAutomation: mocks.runAutoTuneAutomation,
}));
vi.mock("../battle-focus-command.js", () => ({
  BattleFocusCommandEvent: Object.freeze({ CLICK: "click" }),
  runBattleFocusCommand: mocks.runBattleFocusCommand,
}));
vi.mock("../battle-item-command.js", () => ({
  BattleItemCommandEvent: Object.freeze({ CLICK_GEM: "clickGem", CLICK_ITEM: "clickItem" }),
  runBattleItemCommand: mocks.runBattleItemCommand,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ CLICK_AND_RECORD: "clickAndRecord" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../../state/recovery-learner.js", () => ({
  RecoveryLearningEvent: Object.freeze({ RECORD_PRE_DRINK: "recordPreDrink" }),
  runRecoveryLearningAutomation: mocks.runRecoveryLearningAutomation,
}));
vi.mock("../battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: Object.freeze({ RECORD_APPLIED: "recordApplied" }),
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

function applyPlan(plan) {
  return runBattleItemExecution({ type: BattleItemExecutionEvent.APPLY_PLAN, plan, snap: {} });
}

describe("runBattleItemExecution command failures", () => {
  it("records item command exceptions as not acted item execution evidence", () => {
    mocks.runBattleItemCommand.mockImplementation(() => {
      throw new Error("item command failed");
    });

    expect(applyPlan({ type: "gem" })).toBe(false);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith({
      type: "recordApplied",
      result: { kind: "item-execution-event", reason: "itemSubCommandThrew", planType: "gem" },
      acted: false,
      knownResultKind: true,
      failureReason: "itemSubCommandThrew",
      executionError: "item command failed",
    });
  });

  it("records stall focus command exceptions as not acted item execution evidence", () => {
    mocks.runBattleFocusCommand.mockImplementation(() => {
      throw new Error("focus command failed");
    });

    expect(applyPlan({ type: "stall", attempts: [{ kind: "focus" }] })).toBe(false);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith(expect.objectContaining({
      result: { kind: "item-execution-event", reason: "itemSubCommandThrew", planType: "stall" },
      executionError: "focus command failed",
    }));
  });

  it("records stall spirit command exceptions as not acted item execution evidence", () => {
    mocks.runBattleSpiritToggleAutomation.mockImplementation(() => {
      throw new Error("spirit command failed");
    });

    expect(applyPlan({ type: "stall", attempts: [{ kind: "spirit-off" }] })).toBe(false);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith(expect.objectContaining({
      result: { kind: "item-execution-event", reason: "itemSubCommandThrew", planType: "stall" },
      executionError: "spirit command failed",
    }));
  });
});
