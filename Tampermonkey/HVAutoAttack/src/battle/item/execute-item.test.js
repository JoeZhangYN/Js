import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeItem } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
  runOptionAutomation: vi.fn(),
  runRecoveryLearningAutomation: vi.fn(),
}));

vi.mock("../../dom/query.js", () => ({
  gE: mocks.gE,
  isOn: mocks.isOn,
}));
vi.mock("../../dom/selectors.js", () => ({
  itemSelector: (id) => `#item-${id}`,
}));
vi.mock("../../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../../state/store.js", () => ({ g: mocks.g }));
vi.mock("../../state/recovery-learner.js", () => ({
  RecoveryLearningEvent: Object.freeze({ RECORD_PRE_DRINK: "recordPreDrink" }),
  runRecoveryLearningAutomation: mocks.runRecoveryLearningAutomation,
}));

beforeEach(() => {
  const state = { autoTunePotionCount: 4 };
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.g.mockImplementation((key, value) => {
    if (value !== undefined) {
      state[key] = value;
      return value;
    }
    return state[key];
  });
  mocks.runOptionAutomation.mockReturnValue(false);
});

describe("executeItem", () => {
  it("reads auto-tune potion counting through the option entry for gems", () => {
    const gem = { click: vi.fn() };
    mocks.gE.mockReturnValue(gem);
    mocks.runOptionAutomation.mockReturnValue(true);

    expect(executeItem({ type: "gem" }, {})).toBe(true);

    expect(gem.click).toHaveBeenCalledTimes(1);
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "autoTune",
      fallback: false,
    });
    expect(mocks.g).toHaveBeenCalledWith("autoTunePotionCount", 5);
  });

  it("does not count potion use when auto-tune is disabled", () => {
    const potion = { click: vi.fn() };
    mocks.isOn.mockReturnValue(potion);

    expect(executeItem({ type: "potion", candidates: [111], noWaste: false }, {})).toBe(true);

    expect(potion.click).toHaveBeenCalledTimes(1);
    expect(mocks.g).not.toHaveBeenCalledWith("autoTunePotionCount", expect.any(Number));
  });
});
