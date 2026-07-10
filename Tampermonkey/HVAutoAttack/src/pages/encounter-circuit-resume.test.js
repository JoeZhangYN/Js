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
  mocks.gmXhr.mockReset();
  mocks.runUserFeedbackAutomation.mockReset();
  vi.setSystemTime(new Date("2026-06-27T00:30:05.000Z"));
});

describe("encounter generation circuit resume", () => {
  it("keeps a persisted open circuit blocked after page re-entry", () => {
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
      rerun: vi.fn(),
    });

    expect(outcome).toMatchObject({
      action: "blocked",
      blocked: true,
      claimed: false,
      evidence: { reason: "encounterKeyMissing", source: "lobbyResume" },
    });
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });
});
