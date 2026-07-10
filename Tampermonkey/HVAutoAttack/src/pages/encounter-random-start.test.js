import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));
vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

const HVUT_RE_KEY = ["hvut", "re"].join("_");

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(true);
  mocks.runUserFeedbackAutomation.mockReset();
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

  it("records battle-start random encounters without relying on root-page search keys", () => {
    runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
      source: "battleRoundStart",
    });

    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      count: 1,
      clear: true,
    });
  });

  it("ignores root-page random encounter start events without key or battle evidence", () => {
    runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
      search: "",
    });

    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      date: 0,
      key: "",
      count: 0,
      clear: true,
    });
  });

  it("blocks battle-start continuation when encounter state persistence fails", () => {
    vi.stubGlobal("GM_getValue", (_key, fallback) => fallback);
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("GM write blocked");
    });

    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
        source: "battleRoundStart",
      })
    ).toMatchObject({
      action: "blocked",
      blocked: true,
      evidence: { reason: "encounterStartPersistenceFailed" },
    });
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
  });
});
