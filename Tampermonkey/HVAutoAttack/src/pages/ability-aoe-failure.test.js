import { beforeEach, describe, expect, it, vi } from "vitest";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import { ABILITY_AOE_FAILURE_KEY } from "./ability-aoe-failure.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  getValue: vi.fn(),
  runOptionAutomation: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../state/storage.js", () => ({ getValue: mocks.getValue, setValue: mocks.setValue }));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField", WRITE_FIELD: "writeField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function abilitySlot(content) {
  const slot = document.createElement("div");
  slot.setAttribute("onmouseover", `overability('x','y','${content}')`);
  return slot;
}

function lastFailure() {
  return JSON.parse(sessionStorage.getItem(ABILITY_AOE_FAILURE_KEY));
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
  window.history.pushState({}, "", "/?s=Character&ss=ab");
  const abilityTop = document.createElement("div");
  const slot = abilitySlot(
    "Spells Modified: <strong>Imperil</strong> Changes max affected targets to 2"
  );
  mocks.gE.mockImplementation((selector, mode) => {
    if (selector === "#ability_top") return abilityTop;
    if (selector === "[onmouseover*='overability']" && mode === "all") return [slot];
    return null;
  });
  mocks.runOptionAutomation.mockImplementation((event) => event.fallback);
});

describe("ability AoE failure evidence", () => {
  it("does not report capture success or sync option when spell AoE persistence fails", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("spell aoe write blocked");
    });

    const outcome = runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });

    expect(outcome).toMatchObject({ captured: false, reason: "spellAoePersistenceFailed" });
    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(lastFailure()).toMatchObject({
      capability: "abilityAoe",
      stage: "persist-spell-aoe",
      failure: { kind: "storageWrite", key: "spellAoe", error: "spell aoe write blocked" },
    });
  });

  it("records option sync failure after authoritative spell AoE capture succeeds", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "readField" && event.key === "version") return "10.0";
      if (event.type === "writeField" && event.key === "spellAoe") return false;
      return event.fallback ?? {};
    });

    const outcome = runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });

    expect(outcome).toMatchObject({
      captured: true,
      optionSync: { synced: false, reason: "optionPersistenceFailed", spellWritten: false },
    });
    expect(lastFailure()).toMatchObject({
      capability: "abilityAoe",
      stage: "sync-option",
      failure: { kind: "optionWrite", reason: "optionPersistenceFailed", spellWritten: false },
    });
  });

  it("keeps failure fallback from throwing when evidence and warning both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("spell aoe write blocked");
    });

    expect(() =>
      runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE })
    ).not.toThrow();
    console.warn.mockRestore();
    Storage.prototype.setItem.mockRestore();
  });
});
