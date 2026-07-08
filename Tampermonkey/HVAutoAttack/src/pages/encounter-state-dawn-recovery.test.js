import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
}));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));

const HVUT_RE_KEY = "hvut_re";

beforeEach(() => {
  localStorage.clear();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
  mocks.gmXhr.mockReset();
});

describe("encounter state dawn recovery", () => {
  it("backs off news loading when the daily CST 8 dawn event is not an encounter", async () => {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify({ date: 0, key: "", count: 0, clear: true }));
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        responseText: '<div id="eventpane">It is the dawn of a new day!</div>',
      });
    });

    const state = await runEncounterStateAutomation({ type: EncounterStateEvent.LOAD_KEY });

    expect(state).toBeNull();
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      date: 0,
      key: "",
      count: 0,
      clear: true,
      generationFailureCount: 1,
      generationNextAttemptAt: Date.now() + 5 * 60 * 1000,
      generationFailureReason: "dailyResetEvent",
    });
  });
});
