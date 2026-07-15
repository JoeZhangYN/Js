import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENCOUNTER_COOLDOWN_MS } from "./encounter-day-state.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));
vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mocks.gmXhr.mockReset();
  mocks.runUserFeedbackAutomation.mockReset();
  vi.setSystemTime(new Date("2026-06-27T00:30:05.000Z"));
});

describe("encounter generation circuit resume", () => {
  it("migrates a persisted missing-key circuit into the 30:05 probe deadline", () => {
    localStorage.setItem(
      "hvut_re",
      JSON.stringify({
        date: 0,
        key: "",
        count: 0,
        clear: true,
        generationAttemptKey: "2026-06-27:0::true:ready",
        generationFailureCount: 3,
        generationFailureReason: "encounterKeyMissing",
        generationCircuitOpenUntil: Date.now() + 60 * 60 * 1000,
      })
    );

    const outcome = runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });

    expect(outcome).toMatchObject({
      status: "waiting",
      reason: "probeCycle",
      clock: { countdownMs: ENCOUNTER_COOLDOWN_MS },
    });
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });

  it("rechecks an expired legacy missing-key circuit and starts a full probe cycle", async () => {
    const attemptKey = "2026-06-27:0::true:ready";
    localStorage.setItem(
      "hvut_re",
      JSON.stringify({
        date: 0,
        key: "",
        count: 0,
        clear: true,
        generationAttemptKey: attemptKey,
        generationFailureCount: 3,
        generationFailureReason: "encounterKeyMissing",
        generationCircuitOpenUntil: Date.now() + 20 * 60 * 1000,
      })
    );
    mocks.gmXhr.mockImplementation(({ onload }) =>
      onload({ responseText: '<div id="eventpane">No encounter available.</div>' })
    );

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });

    expect(outcome).toMatchObject({
      status: "waiting",
      reason: "probeCycle",
      clock: { countdownMs: ENCOUNTER_COOLDOWN_MS },
    });
    expect(mocks.gmXhr).toHaveBeenCalledOnce();
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
  });
});
