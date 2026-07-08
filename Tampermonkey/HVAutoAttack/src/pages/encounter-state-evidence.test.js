import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { ENCOUNTER_STATE_FAILURE_KEY } from "./encounter-state-failure.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

const HVUT_RE_KEY = "hvut_re";
const ENCOUNTER_STATE_FAILURE_STORAGE_KEY = "HVAA:lastEncounterStateFailure";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  vi.restoreAllMocks();
});

describe("encounter state failure evidence", () => {
  it("persists corrupted encounter state evidence while failing closed", () => {
    localStorage.setItem(HVUT_RE_KEY, "{bad-json");

    const state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });

    expect(state).toEqual({ date: 0, key: "", count: 0, clear: true });
    expect(JSON.parse(sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY))).toMatchObject({
      capability: "encounterState",
      source: "encounterState",
      stage: "read-local-json",
      detail: { key: HVUT_RE_KEY },
    });
    expect(ENCOUNTER_STATE_FAILURE_KEY).toBe(ENCOUNTER_STATE_FAILURE_STORAGE_KEY);
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] encounter state failed",
        expect.objectContaining({ stage: "read-local-json" }),
      ],
    });
  });

  it("keeps encounter state fallback working when typed warning fails", () => {
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    localStorage.setItem(HVUT_RE_KEY, "{bad-json");

    expect(() =>
      runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT })
    ).not.toThrow();
    expect(JSON.parse(sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY))).toMatchObject({
      stage: "read-local-json",
    });
  });

  it("keeps encounter state fallback working when failure evidence storage and typed warning fail", () => {
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    localStorage.setItem(HVUT_RE_KEY, "{bad-json");

    let state;
    expect(() => {
      state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });
    }).not.toThrow();

    expect(state).toEqual({ date: 0, key: "", count: 0, clear: true });
    expect(window.sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY)).toBeNull();
  });
});
