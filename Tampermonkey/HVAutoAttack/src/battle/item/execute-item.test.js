import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeItem } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
  runAutoTuneAutomation: vi.fn(),
  runBattleFocusCommand: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runRecoveryLearningAutomation: vi.fn(),
}));

vi.mock("../../dom/query.js", () => ({
  gE: mocks.gE,
  isOn: mocks.isOn,
}));
vi.mock("../../dom/selectors.js", () => ({
  itemSelector: (id) => `#item-${id}`,
}));
vi.mock("../../state/auto-tune.js", () => ({
  AutoTuneEvent: Object.freeze({ RECORD_POTION_USE: "recordPotionUse" }),
  runAutoTuneAutomation: mocks.runAutoTuneAutomation,
}));
vi.mock("../battle-focus-command.js", () => ({
  BattleFocusCommandEvent: Object.freeze({ CLICK: "click" }),
  runBattleFocusCommand: mocks.runBattleFocusCommand,
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
    const gem = { click: vi.fn() };
    mocks.gE.mockReturnValue(gem);

    expect(executeItem({ type: "gem" }, {})).toBe(true);

    expect(gem.click).toHaveBeenCalledTimes(1);
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({
      type: "recordPotionUse",
    });
  });

  it("reports auto-tune potion-use event for used potions", () => {
    const potion = { click: vi.fn() };
    mocks.isOn.mockReturnValue(potion);

    expect(executeItem({ type: "potion", candidates: [111], noWaste: false }, {})).toBe(true);

    expect(potion.click).toHaveBeenCalledTimes(1);
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({
      type: "recordPotionUse",
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
    const draught = { click: vi.fn() };
    mocks.runBattleFocusCommand.mockReturnValue(false);
    mocks.gE.mockReturnValue(draught);

    expect(
      executeItem(
        { type: "stall", attempts: [{ kind: "focus" }, { kind: "draught", id: 123 }] },
        { mp: 50 }
      )
    ).toBe(true);

    expect(mocks.runBattleFocusCommand).toHaveBeenCalledWith({ type: "click" });
    expect(mocks.runRecoveryLearningAutomation).toHaveBeenCalledWith({
      type: "recordPreDrink",
      potionId: 123,
      snap: { mp: 50 },
    });
    expect(draught.click).toHaveBeenCalledTimes(1);
  });
});
