import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeItem } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
  runAutoTuneAutomation: vi.fn(),
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
});
