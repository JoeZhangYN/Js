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
  mocks.runBattleItemCommand.mockReturnValue(true);
  mocks.runAutoTuneAutomation.mockImplementation(() => {
    throw new Error("auto tune failed");
  });
});

function applyPlan(plan) {
  return runBattleItemExecution({ type: BattleItemExecutionEvent.APPLY_PLAN, plan, snap: {} });
}

describe("runBattleItemExecution auto-tune record failure", () => {
  it("keeps clicked gems acted when auto-tune recording fails", () => {
    expect(applyPlan({ type: "gem" })).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith({ type: "clickGem" });
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({ type: "recordPotionUse" });
  });

  it("keeps clicked potions acted when auto-tune recording fails", () => {
    expect(applyPlan({ type: "potion", candidates: [111], noWaste: false })).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith({ type: "clickItem", itemId: 111 });
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({ type: "recordPotionUse" });
  });
});
