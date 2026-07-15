import { beforeEach, describe, expect, it, vi } from "vitest";
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
  it("keeps a persisted open circuit degraded after page re-entry without a popup", () => {
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
        generationCircuitOpenUntil: Date.now() + 1000,
      })
    );

    const outcome = runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });

    expect(outcome).toMatchObject({
      status: "degraded",
      reason: "encounterKeyMissing",
      diagnostic: { evidence: { reason: "encounterKeyMissing", source: "lobbyResume" } },
    });
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });

  it("clears an expired displayed circuit incident and starts a new recovery episode", async () => {
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
        generationCircuitOpenUntil: Date.now() - 1,
      })
    );
    sessionStorage.setItem(
      "HVAA:lastEncounterGenerationIncident",
      JSON.stringify({
        id: `encounter-generation:${attemptKey}:encounterKeyMissing:lobby:3`,
        attemptKey,
        reason: "encounterKeyMissing",
        recoveryEpisode: 3,
        sourceIdentity: "lobby",
        display: { status: "shown" },
      })
    );
    mocks.gmXhr.mockImplementation(({ onload }) =>
      onload({ responseText: '<div id="eventpane">No encounter available.</div>' })
    );

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });

    expect(outcome).toMatchObject({
      status: "degraded",
      diagnostic: {
        evidence: { incident: { recoveryEpisode: 4 } },
      },
    });
    expect(mocks.gmXhr).toHaveBeenCalledOnce();
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
  });
});
