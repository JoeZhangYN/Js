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
  it("persists dawn as the non-counting UTC day anchor", async () => {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify({ date: 0, key: "", count: 0, clear: true }));
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        responseText: '<div id="eventpane">It is the dawn of a new day!</div>',
      });
    });

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: { method: "GET", url: "https://e-hentai.org/news.php" },
    });

    expect(result).toMatchObject({
      status: "newDay",
      reason: "dailyResetEvent",
      persisted: true,
      blocked: false,
      application: "newDay",
      recovery: { status: "countdown", reason: "cooldown" },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      date: Date.now(),
      key: "",
      count: 0,
      clear: true,
      dayPhase: "active",
      anchorReason: "newDay",
      invalidCycleCount: 0,
    });
  });
});
