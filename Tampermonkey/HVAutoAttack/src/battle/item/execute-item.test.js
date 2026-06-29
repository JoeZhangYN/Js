import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeItem } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
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
vi.mock("../../state/store.js", () => ({ g: mocks.g }));
vi.mock("../../state/recovery-learner.js", () => ({
  RecoveryLearningEvent: Object.freeze({ RECORD_PRE_DRINK: "recordPreDrink" }),
  runRecoveryLearningAutomation: mocks.runRecoveryLearningAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.g.mockReturnValue(undefined);
});

describe("executeItem", () => {
  it("reports auto-tune potion-use event for gems", () => {
    mocks.runBattleItemCommand.mockReturnValue(true);

    expect(executeItem({ type: "gem" }, {})).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith({ type: "clickGem" });
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({
      type: "recordPotionUse",
    });
  });

  it("reports auto-tune potion-use event for used potions", () => {
    mocks.runBattleItemCommand.mockReturnValue(true);

    expect(executeItem({ type: "potion", candidates: [111], noWaste: false }, {})).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith({
      type: "clickItem",
      itemId: 111,
    });
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({
      type: "recordPotionUse",
    });
  });

  it("records no-waste potion facts before the item command clicks", () => {
    mocks.runBattleItemCommand.mockImplementation((event) => {
      event.beforeClick();
      return true;
    });

    expect(
      executeItem({ type: "potion", candidates: [11191], noWaste: true }, { hpAbs: 200 })
    ).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "clickItem",
        itemId: 11191,
      })
    );
    expect(mocks.runRecoveryLearningAutomation).toHaveBeenCalledWith({
      type: "recordPreDrink",
      potionId: 11191,
      recoveryAbs: { hp: 200, mp: undefined, sp: undefined },
    });
  });

  it("reports Spirit toggle cooldown event for stall spirit-off", () => {
    mocks.runBattleSpiritToggleAutomation.mockReturnValue(true);

    expect(executeItem({ type: "stall", attempts: [{ kind: "spirit-off" }] }, {})).toBe(true);

    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "clickAndRecord",
    });
  });

  it("routes stall Focus attempts through the Focus command entry", () => {
    mocks.runBattleFocusCommand.mockReturnValue(true);

    expect(executeItem({ type: "stall", attempts: [{ kind: "focus" }] }, {})).toBe(true);

    expect(mocks.runBattleFocusCommand).toHaveBeenCalledWith({ type: "click" });
  });

  it("continues stall attempts when the Focus command cannot click", () => {
    mocks.runBattleFocusCommand.mockReturnValue(false);
    mocks.runBattleItemCommand.mockImplementation((event) => {
      event.beforeClick();
      return true;
    });

    expect(
      executeItem(
        { type: "stall", attempts: [{ kind: "focus" }, { kind: "draught", id: 123 }] },
        { mpAbs: 50 }
      )
    ).toBe(true);

    expect(mocks.runBattleFocusCommand).toHaveBeenCalledWith({ type: "click" });
    expect(mocks.runRecoveryLearningAutomation).toHaveBeenCalledWith({
      type: "recordPreDrink",
      potionId: 123,
      recoveryAbs: { hp: undefined, mp: 50, sp: undefined },
    });
    expect(mocks.runBattleItemCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "clickItem",
        itemId: 123,
      })
    );
  });

  it("routes scroll candidates through the item command entry", () => {
    mocks.runBattleItemCommand.mockReturnValueOnce(false).mockReturnValueOnce(true);

    expect(executeItem({ type: "scroll", candidates: [11111, 22222] }, {})).toBe(true);

    expect(mocks.runBattleItemCommand).toHaveBeenNthCalledWith(1, {
      type: "clickItem",
      itemId: 11111,
    });
    expect(mocks.runBattleItemCommand).toHaveBeenNthCalledWith(2, {
      type: "clickItem",
      itemId: 22222,
    });
  });
});
