import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAndActivateSpirit } from "./activate-spirit.js";

const mocks = vi.hoisted(() => ({
  checkCondition: vi.fn(),
  gE: vi.fn(),
  isSpiritActive: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../../dom/query.js", () => ({
  gE: mocks.gE,
  isSpiritActive: mocks.isSpiritActive,
}));
vi.mock("../../settings/condition-eval.js", () => ({
  checkCondition: mocks.checkCondition,
}));
vi.mock("../../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
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
  mocks.gE.mockReturnValue({ click: vi.fn() });
  mocks.isSpiritActive.mockReturnValue(false);
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

  it("does not click when Spirit is already active", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);
    mocks.isSpiritActive.mockReturnValue(true);

    expect(checkAndActivateSpirit()).toBe(false);

    expect(spirit.click).not.toHaveBeenCalled();
  });

  it("clicks Spirit and claims the turn when enabled and inactive", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);

    expect(checkAndActivateSpirit()).toBe(true);

    expect(spirit.click).toHaveBeenCalledTimes(1);
  });
});
