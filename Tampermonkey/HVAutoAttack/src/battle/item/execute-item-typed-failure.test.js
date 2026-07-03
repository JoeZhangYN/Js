import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemExecutionEvent, runBattleItemExecution } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  runAutoTuneAutomation: vi.fn(),
  runBattleFocusCommand: vi.fn(),
  runBattleItemCommand: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runRecoveryLearningAutomation: vi.fn(),
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

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

function applyPlan(plan, snap = {}) {
  return runBattleItemExecution({ type: BattleItemExecutionEvent.APPLY_PLAN, plan, snap });
}

describe("runBattleItemExecution typed command failures", () => {
  it("does not claim typed failed gem commands as acted", () => {
    mocks.runBattleItemCommand.mockReturnValue({
      kind: "failed",
      reason: "gemElementReadFailed",
    });

    expect(applyPlan({ type: "gem" })).toBe(false);

    expect(mocks.runAutoTuneAutomation).not.toHaveBeenCalled();
  });

  it("continues stall attempts after a typed failed focus command", () => {
    mocks.runBattleFocusCommand.mockReturnValue({
      kind: "failed",
      reason: "focusElementReadFailed",
    });
    mocks.runBattleItemCommand.mockReturnValue(true);

    expect(
      applyPlan({ type: "stall", attempts: [{ kind: "focus" }, { kind: "draught", id: 123 }] })
    ).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "clickItem", itemId: 123 })
    );
  });

  it("continues scroll candidates after a typed failed item command", () => {
    mocks.runBattleItemCommand
      .mockReturnValueOnce({ kind: "failed", reason: "itemElementReadFailed" })
      .mockReturnValueOnce(true);

    expect(applyPlan({ type: "scroll", candidates: [11111, 22222] })).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenNthCalledWith(2, {
      type: "clickItem",
      itemId: 22222,
    });
  });
});
