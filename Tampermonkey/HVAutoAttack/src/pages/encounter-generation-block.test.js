import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";

const mocks = vi.hoisted(() => ({ runUserFeedbackAutomation: vi.fn() }));

vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  mocks.runUserFeedbackAutomation.mockReset();
});

describe("encounter generation blocking feedback", () => {
  it("keeps automation blocked when the diagnostic prompt itself fails", () => {
    mocks.runUserFeedbackAutomation.mockImplementation(() => {
      throw new Error("prompt blocked");
    });

    expect(
      showEncounterGenerationBlock(
        {
          reason: "encounterKeyMissing",
          state: { generationAttemptKey: "attempt-1" },
        },
        "lobby"
      )
    ).toMatchObject({
      action: "blocked",
      blocked: true,
      handled: true,
      evidence: { feedbackShown: false, feedbackError: "prompt blocked" },
    });
    expect(
      JSON.parse(sessionStorage.getItem(DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT))
    ).toMatchObject({ display: { status: "failed", error: "prompt blocked" } });

    mocks.runUserFeedbackAutomation.mockReturnValue(null);
    expect(
      showEncounterGenerationBlock(
        {
          reason: "encounterKeyMissing",
          state: { generationAttemptKey: "attempt-1" },
        },
        "lobby"
      )
    ).toMatchObject({ evidence: { feedbackShown: true } });
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledTimes(2);
  });

  it("persists the complete incident before opening the blocking prompt", () => {
    const shared = new Map();
    const getValue = vi.fn((key, fallback) => (shared.has(key) ? shared.get(key) : fallback));
    const setValue = vi.fn((key, value) => shared.set(key, value));
    vi.stubGlobal("GM_getValue", getValue);
    vi.stubGlobal("GM_setValue", setValue);

    const outcome = showEncounterGenerationBlock(
      {
        reason: "dailyResetEvent",
        request: { method: "GET", url: "https://e-hentai.org/news.php?encounter" },
        state: { generationAttemptKey: "attempt-2" },
      },
      "lobby"
    );

    expect(setValue.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runUserFeedbackAutomation.mock.invocationCallOrder[0]
    );
    expect(outcome).toMatchObject({
      blocked: true,
      evidence: {
        incidentPersistence: { ok: true, authority: "gm", scope: "crossOrigin" },
      },
    });
    expect(shared.get(DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT)).toMatchObject({
      reason: "dailyResetEvent",
      request: { url: "https://e-hentai.org/news.php?encounter" },
      display: { status: "shown" },
    });
  });

  it("deduplicates the same blocking incident after it was displayed", () => {
    const generation = {
      reason: "encounterKeyMissing",
      state: { generationAttemptKey: "attempt-3" },
    };

    showEncounterGenerationBlock(generation, "lobby");
    const repeated = showEncounterGenerationBlock(generation, "lobby");

    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
    expect(repeated).toMatchObject({
      blocked: true,
      evidence: { feedbackDeduplicated: true },
    });
  });

  it("keeps cross-site automation blocked when shared incident storage is unavailable", () => {
    const outcome = showEncounterGenerationBlock(
      {
        reason: "dailyResetEvent",
        source: { pageKind: "ehentai" },
        state: { generationAttemptKey: "attempt-4" },
      },
      "crossSite"
    );

    expect(outcome).toMatchObject({
      blocked: true,
      handled: true,
      evidence: {
        incidentPersistence: {
          ok: false,
          kind: "recordFailed",
          reason: "sharedAuthorityUnavailable",
        },
      },
    });
  });
});
