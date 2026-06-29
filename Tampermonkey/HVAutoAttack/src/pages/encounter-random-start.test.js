import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

const HVUT_RE_KEY = ["hvut", "re"].join("_");

beforeEach(() => {
  localStorage.clear();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(true);
});

describe("runEncounterAutomation random encounter start", () => {
  it("gates random encounter state updates through the encounter option", () => {
    mocks.runOptionAutomation.mockReturnValue(false);

    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
        search: "?s=Battle&ss=ba&encounter=abc123=",
      })
    ).toEqual({ claimed: false, skipped: true });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "encounter",
      fallback: false,
    });
    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
  });

  it("records random encounter starts when encounter automation is enabled", () => {
    runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
      search: "?s=Battle&ss=ba&encounter=abc123=",
    });

    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      key: "abc123=",
      clear: true,
    });
  });
});
