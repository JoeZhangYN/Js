import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { ENCOUNTER_STATE_FAILURE_KEY } from "./encounter-state-failure.js";

const HVUT_RE_KEY = "hvut_re";
const ENCOUNTER_STATE_FAILURE_STORAGE_KEY = "HVAA:lastEncounterStateFailure";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("encounter state failure evidence", () => {
  it("persists corrupted encounter state evidence while failing closed", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(HVUT_RE_KEY, "{bad-json");

    const state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });

    expect(state).toEqual({ date: 0, key: "", count: 0, clear: true });
    expect(JSON.parse(sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY))).toMatchObject({
      source: "encounterState",
      stage: "read-local-json",
      detail: { key: HVUT_RE_KEY },
    });
    expect(ENCOUNTER_STATE_FAILURE_KEY).toBe(ENCOUNTER_STATE_FAILURE_STORAGE_KEY);
  });

  it("keeps encounter state fallback working when console warning throws", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("warn blocked");
    });
    localStorage.setItem(HVUT_RE_KEY, "{bad-json");

    expect(() =>
      runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT })
    ).not.toThrow();
    expect(JSON.parse(sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY))).toMatchObject({
      stage: "read-local-json",
    });
  });
});
