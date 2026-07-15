import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAutomaticEncounterGate,
  isAutomaticEncounterEnabled,
} from "./encounter-option-gate.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function setOptions(option) {
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type !== "readField") return undefined;
    return option[event.key] !== undefined ? option[event.key] : event.fallback;
  });
}

beforeEach(() => {
  mocks.runOptionAutomation.mockReset();
  setOptions({});
});

describe("isAutomaticEncounterEnabled", () => {
  it("enables encounter automation from the HVAA explicit encounter option", () => {
    setOptions({ encounter: true, reNotification: false });

    expect(isAutomaticEncounterEnabled()).toBe(true);
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "encounter",
      fallback: false,
    });
  });

  it("derives main-world encounter automation from the hv-utils RE notification authority", () => {
    setOptions({ encounter: false, reNotification: true });

    expect(isAutomaticEncounterEnabled()).toBe(true);
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "reNotification",
      fallback: true,
    });
  });

  it("keeps encounter automation disabled only when both encounter entries are off", () => {
    setOptions({ encounter: false, reNotification: false });

    expect(isAutomaticEncounterEnabled()).toBe(false);
  });

  it("keeps the isekai capability unavailable without reading main-world options", () => {
    const gate = createAutomaticEncounterGate(false, {
      readOption: mocks.runOptionAutomation,
    });

    expect(gate.enabled()).toBe(false);
    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
  });
});
