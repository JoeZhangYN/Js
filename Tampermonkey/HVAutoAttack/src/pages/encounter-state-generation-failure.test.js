import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

const mocks = vi.hoisted(() => ({ gmXhr: vi.fn() }));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));

const GENERATION_REQUEST = {
  method: "GET",
  url: "https://e-hentai.org/news.php",
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
  mocks.gmXhr.mockReset();
});

describe("encounter generation transport recovery", () => {
  it("backs off and preserves typed evidence when news key loading fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.gmXhr.mockImplementation(({ onerror }) => onerror({ status: 0 }));

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "transportFailure",
      reason: "generationRequestFailed",
      persisted: true,
      blocked: false,
      recovery: { status: "countdown", reason: "generationBackoff" },
      state: { generationFailureCount: 1, generationFailureReason: "generationRequestFailed" },
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] encounter state failed",
      expect.objectContaining({ stage: "load-key-error", detail: { status: 0 } })
    );
  });

  it("backs off and preserves typed evidence when news key loading times out", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.gmXhr.mockImplementation(({ ontimeout }) => ontimeout());

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "transportFailure",
      reason: "generationRequestTimeout",
      persisted: true,
      recovery: { status: "countdown", reason: "generationBackoff" },
      state: { generationFailureCount: 1, generationFailureReason: "generationRequestTimeout" },
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] encounter state failed",
      expect.objectContaining({ stage: "load-key-timeout" })
    );
  });

  it("classifies rejected HTTP responses before parsing encounter content", async () => {
    mocks.gmXhr.mockImplementation(({ onload }) =>
      onload({ status: 503, responseText: "temporarily unavailable" })
    );

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "transportFailure",
      reason: "generationRequestRejected",
      state: { generationFailureReason: "generationRequestRejected" },
      recovery: { reason: "generationBackoff" },
    });
  });

  it("records canonical news-page absence separately from unrecognized response drift", async () => {
    mocks.gmXhr.mockImplementation(({ onload }) =>
      onload({
        status: 200,
        finalUrl: "https://e-hentai.org/news.php",
        responseText:
          '<html><head><title>E-Hentai Galleries</title></head><body><div id="newsouter"><div id="newsinner">News</div></div></body></html>',
      })
    );

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "encounterKeyMissing",
      result: {
        responseIdentity: {
          kind: "newsPage",
          finalRoute: { origin: "https://e-hentai.org", pathname: "/news.php" },
        },
      },
      state: { generationFailureReason: "encounterKeyMissing" },
      recovery: { reason: "generationBackoff" },
    });
  });

  it("turns synchronous GM request exceptions into typed recovery", async () => {
    mocks.gmXhr.mockImplementation(() => {
      throw new Error("GM request blocked");
    });

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "transportFailure",
      reason: "generationRequestFailed",
      result: { failure: { error: "GM request blocked" } },
      recovery: { reason: "generationBackoff" },
    });
  });

  it("blocks when the generation recovery write fails after normalization succeeds", async () => {
    let sharedState;
    vi.stubGlobal("GM_getValue", (_key, fallback) => sharedState || fallback);
    vi.stubGlobal("GM_setValue", (_key, value) => {
      if (value.generationFailureCount) {
        throw new Error("GM encounter-failure write blocked");
      }
      sharedState = value;
    });
    mocks.gmXhr.mockImplementation(({ onload }) =>
      onload({ responseText: '<div id="eventpane">No encounter available.</div>' })
    );

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "persistenceFailed",
      reason: "generationStatePersistenceFailed",
      persisted: false,
      blocked: true,
      persistence: { ok: false, reason: "gmWriteFailed" },
      state: {
        cycleReadyAt: 0,
        generationFailureCount: 1,
        generationNextAttemptAt: Date.now() + 60_000,
      },
    });
    expect(mocks.gmXhr).toHaveBeenCalledOnce();
    expect(sharedState).toMatchObject({
      date: 0,
      key: "",
      count: 0,
      clear: true,
      schemaVersion: 4,
    });
    expect(localStorage.getItem("hvut_re")).toBeNull();
  });
});
