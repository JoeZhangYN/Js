import { beforeEach, describe, expect, it, vi } from "vitest";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  getValue: vi.fn(),
  runOptionAutomation: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../state/storage.js", () => ({
  getValue: mocks.getValue,
  setValue: mocks.setValue,
}));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ WRITE: "write" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  window.history.pushState({}, "", "/");
});

describe("runAbilityAoeAutomation", () => {
  it("loads stored AoE state through the ability AoE entry", () => {
    mocks.getValue.mockReturnValue({ Imperil: 2 });

    runAbilityAoeAutomation({ type: AbilityAoeEvent.LOAD_STORED_AOE });

    expect(mocks.getValue).toHaveBeenCalledWith("spellAoe", true);
    expect(mocks.g).toHaveBeenCalledWith("spellAoe", { Imperil: 2 });
  });

  it("captures the ability page AoE map and syncs option display fields", () => {
    window.history.pushState({}, "", "/?s=Character&ss=ab");
    const slot = document.createElement("div");
    slot.setAttribute(
      "onmouseover",
      "overability('x','y','Spells Modified: <strong>Imperil</strong> Changes max affected targets to 2 Spells Modified: <strong>Blizzard</strong> Changes max affected targets to 3')"
    );
    const abilityTop = document.createElement("div");
    const option = {};

    mocks.g.mockImplementation((key) => (key === "option" ? option : undefined));
    mocks.gE.mockImplementation((selector, mode) => {
      if (selector === "#ability_top") return abilityTop;
      if (selector === "[onmouseover*='overability']" && mode === "all") return [slot];
      return null;
    });

    runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });

    expect(mocks.setValue).toHaveBeenCalledWith("spellAoe", { Imperil: 2, Blizzard: 3 });
    expect(option.debuffSkillAoe).toMatchObject({ Im: 2 });
    expect(option.spellAoe).toMatchObject({ 23: 3 });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "write", option });
  });

  it("ignores non-ability pages", () => {
    runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.setValue).not.toHaveBeenCalled();
  });
});
