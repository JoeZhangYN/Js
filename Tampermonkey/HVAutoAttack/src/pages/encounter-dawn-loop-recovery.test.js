import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runNavigationAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ OPEN_URL: "openUrl" }),
  NavigationRedirectReason: Object.freeze({ ENCOUNTER_ENTRY: "encounterEntry" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

const HVUT_RE_KEY = "hvut_re";
const DAWN_HTML = '<div id="eventpane">It is the dawn of a new day!</div>';
const MISSING_HTML = '<div id="eventpane">No random encounter is available.</div>';

beforeEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("UTC encounter new-day recovery", () => {
  it("records dawn once and starts cooldown without navigation, feedback, or a second request", async () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.UTC(2026, 5, 26, 23, 59),
        key: "",
        count: 24,
        clear: true,
      })
    );
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ responseText: DAWN_HTML }));
    const rerun = vi.fn();

    const first = await runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK, rerun });
    expect(vi.getTimerCount()).toBe(1);
    const second = await runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK, rerun });

    expect(first).toMatchObject({
      claimed: false,
      scheduled: true,
      generation: {
        status: "newDay",
        reason: "dailyResetEvent",
        application: "newDay",
        blocked: false,
        recovery: { status: "countdown", reason: "cooldown", countdownMs: 30 * 60 * 1000 + 5000 },
      },
    });
    expect(second).toMatchObject({ claimed: false, scheduled: true });
    expect(mocks.gmXhr).toHaveBeenCalledTimes(1);
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      date: Date.now(),
      count: 0,
      dayPhase: "active",
      anchorReason: "newDay",
      invalidCycleCount: 0,
    });
  });

  it("coalesces simultaneous rollover ticks into one generation request", async () => {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify({ date: 0, key: "", count: 0, clear: true }));
    let finishRequest;
    mocks.gmXhr.mockImplementation((request) => {
      finishRequest = () => request.onload({ responseText: MISSING_HTML });
    });

    const first = runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK, rerun: vi.fn() });
    const second = runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK, rerun: vi.fn() });

    expect(mocks.gmXhr).toHaveBeenCalledTimes(1);
    finishRequest();
    await expect(first).resolves.toMatchObject({ claimed: false });
    await expect(second).resolves.toMatchObject({ claimed: false });
    expect(mocks.gmXhr).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      generationFailureCount: 1,
    });
  });

  it("blocks with copy-ready evidence when the same generation attempt opens the circuit", async () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: 0,
        key: "",
        count: 0,
        clear: true,
        generationAttemptKey: "2026-06-27:0::true:ready",
        generationFailureCount: 2,
        generationFailureReason: "encounterKeyMissing",
      })
    );
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ responseText: MISSING_HTML }));

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: vi.fn(),
    });

    expect(outcome).toMatchObject({ action: "blocked", blocked: true, claimed: false });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blockingError",
        incident: "encounter-generation:2026-06-27:0::true:ready:encounterKeyMissing:lobby:3",
        evidence: expect.objectContaining({
          capability: "encounterGeneration",
          reason: "encounterKeyMissing",
        }),
      })
    );
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      generationFailureCount: 3,
      generationFailureReason: "encounterKeyMissing",
      generationCircuitOpenUntil: Date.now() + 60 * 60 * 1000,
    });
  });
});
