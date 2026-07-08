import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENCOUNTER_STATE_FAILURE_KEY,
  recordEncounterStateFailure,
} from "./encounter-state-failure.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

beforeEach(() => {
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

describe("recordEncounterStateFailure", () => {
  it("records encounter state failures as structured evidence", () => {
    const evidence = recordEncounterStateFailure(
      "read-local-json",
      { key: "hvut_re", error: "bad json" },
      { sessionStorage }
    );

    expect(evidence).toMatchObject({
      source: "encounterState",
      stage: "read-local-json",
      detail: { key: "hvut_re", error: "bad json" },
    });
    expect(JSON.parse(sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY))).toMatchObject(evidence);
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] encounter state failed",
        expect.objectContaining({ stage: "read-local-json" }),
      ],
    });
  });

  it("does not throw when evidence storage and typed warning both fail", () => {
    const blockedStorage = {
      setItem: () => {
        throw new Error("storage blocked");
      },
    };
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    expect(() =>
      recordEncounterStateFailure(
        "write-local",
        { key: "hvut_re" },
        {
          sessionStorage: blockedStorage,
        }
      )
    ).not.toThrow();
  });
});
