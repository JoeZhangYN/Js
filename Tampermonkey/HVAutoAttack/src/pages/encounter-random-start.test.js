import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

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

  it("recognizes random encounter starts without starting cooldown or counting", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
        search: "?s=Battle&ss=ba&encounter=abc123=",
      })
    ).toEqual({ claimed: false, recognized: true });

    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
  });

  it("counts victory and defeat only when the random encounter reaches a terminal result", () => {
    const victory = runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_COMPLETED,
      outcome: "victory",
      roundType: "ba",
    });
    vi.setSystemTime(new Date("2026-06-27T12:31:00.000Z"));
    const defeat = runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_COMPLETED,
      outcome: "defeat",
      roundType: "ba",
    });

    expect(victory).toMatchObject({ completed: true, state: { count: 1 } });
    expect(defeat).toMatchObject({
      completed: true,
      state: {
        date: Date.now(),
        count: 2,
        anchorReason: "encounterCompleted",
        dayPhase: "active",
      },
    });
  });

  it("ignores terminal battles outside the main-world random encounter identity", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_COMPLETED,
        outcome: "victory",
        roundType: "ar",
      })
    ).toEqual({ claimed: false, skipped: true });
    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
  });

  it("does not count a non-terminal event even when it claims random-encounter identity", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_COMPLETED,
        outcome: "ongoing",
        roundType: "ba",
      })
    ).toEqual({ claimed: false, skipped: true });
    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
  });

  it("recognizes battle-start evidence without mutating encounter state", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
        source: "battleRoundStart",
      })
    ).toEqual({ claimed: false, recognized: true });

    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
  });

  it("does not recognize root-page start events without key or battle evidence", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
        search: "",
      })
    ).toEqual({ claimed: false, recognized: false });
    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
  });

  it("records completion persistence failures as diagnostics without blocking battle completion", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("GM_getValue", (_key, fallback) => fallback);
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("GM write blocked");
    });

    expect(
      runEncounterAutomation({
        type: EncounterEvent.RANDOM_ENCOUNTER_COMPLETED,
        outcome: "defeat",
        roundType: "ba",
      })
    ).toMatchObject({ claimed: false, completed: false, persistence: { ok: false } });
    expect(warn).toHaveBeenCalled();
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
  });
});
