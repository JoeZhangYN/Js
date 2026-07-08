import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENCOUNTER_STATE_FAILURE_KEY,
  recordEncounterStateFailure,
} from "./encounter-state-failure.js";

beforeEach(() => {
  sessionStorage.clear();
});

describe("recordEncounterStateFailure", () => {
  it("records encounter state failures as structured evidence", () => {
    const warn = vi.fn();

    const evidence = recordEncounterStateFailure(
      "read-local-json",
      { key: "hvut_re", error: "bad json" },
      { sessionStorage, warn }
    );

    expect(evidence).toMatchObject({
      source: "encounterState",
      stage: "read-local-json",
      detail: { key: "hvut_re", error: "bad json" },
    });
    expect(JSON.parse(sessionStorage.getItem(ENCOUNTER_STATE_FAILURE_KEY))).toMatchObject(evidence);
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] encounter state failed",
      expect.objectContaining({ stage: "read-local-json" })
    );
  });

  it("does not throw when evidence storage and console warning both fail", () => {
    const blockedStorage = {
      setItem: () => {
        throw new Error("storage blocked");
      },
    };
    const warn = () => {
      throw new Error("warn blocked");
    };

    expect(() =>
      recordEncounterStateFailure(
        "write-local",
        { key: "hvut_re" },
        {
          sessionStorage: blockedStorage,
          warn,
        }
      )
    ).not.toThrow();
  });
});
