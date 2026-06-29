import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAndActivateSpirit } from "./activate-spirit.js";

const mocks = vi.hoisted(() => ({
  checkCondition: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../../settings/condition-eval.js", () => ({
  checkCondition: mocks.checkCondition,
}));
vi.mock("../../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ ACTIVATE_IF_INACTIVE: "activateIfInactive" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));

function optionReader(enabled = true, condition = "cond") {
  return (event) => {
    if (event.key === "preCastSS") return enabled;
    if (event.key === "preCastSSCondition") return condition;
    return event.fallback;
  };
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runOptionAutomation.mockImplementation(optionReader());
  mocks.checkCondition.mockReturnValue(true);
  mocks.runBattleSpiritToggleAutomation.mockReturnValue(true);
});

describe("checkAndActivateSpirit", () => {
  it("does not activate when pre-cast Spirit is disabled", () => {
    mocks.runOptionAutomation.mockImplementation(optionReader(false));

    expect(checkAndActivateSpirit()).toBe(false);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "preCastSS",
      fallback: false,
    });
    expect(mocks.checkCondition).not.toHaveBeenCalled();
  });

  it("reads the condition through option entry before checking it", () => {
    mocks.checkCondition.mockReturnValue(false);

    expect(checkAndActivateSpirit()).toBe(false);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "preCastSSCondition",
      fallback: "",
    });
    expect(mocks.checkCondition).toHaveBeenCalledWith("cond");
  });

  it("claims the turn only when the Spirit toggle command activates it", () => {
    mocks.runBattleSpiritToggleAutomation.mockReturnValue(false);

    expect(checkAndActivateSpirit()).toBe(false);

    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "activateIfInactive",
    });
  });

  it("routes pre-cast Spirit activation through the command entry", () => {
    expect(checkAndActivateSpirit()).toBe(true);

    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "activateIfInactive",
    });
  });
});
