import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  for (const mock of Object.values(mocks)) mock.mockReset();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
});

describe("encounter persistence loop recovery", () => {
  it("blocks a stale-GM second tick without issuing another generation request", async () => {
    const shared = new Map();
    vi.stubGlobal("GM_getValue", (key, fallback) => (shared.has(key) ? shared.get(key) : fallback));
    vi.stubGlobal("GM_setValue", (key, value) => {
      if (key === "hvut_re" && value.generationFailureCount) {
        throw new Error("GM recovery write blocked");
      }
      shared.set(key, value);
    });
    mocks.gmXhr.mockImplementation(({ onload }) =>
      onload({ responseText: '<div id="eventpane">No encounter available.</div>' })
    );

    const first = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: vi.fn(),
    });
    const second = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: vi.fn(),
    });

    expect(first).toMatchObject({ action: "blocked", blocked: true });
    expect(second).toMatchObject({
      action: "blocked",
      blocked: true,
      evidence: { feedbackDeduplicated: true },
    });
    expect(mocks.gmXhr).toHaveBeenCalledOnce();
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(shared.get("hvut_re")).toMatchObject({
      date: 0,
      key: "",
      count: 0,
      clear: true,
      schemaVersion: 2,
    });
  });
});
