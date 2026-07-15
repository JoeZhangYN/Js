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

describe("UTC dawn cooldown", () => {
  it("checks for an encounter only after the dawn-owned cooldown expires", async () => {
    localStorage.setItem(
      "hvut_re",
      JSON.stringify({
        date: Date.UTC(2026, 5, 26, 23, 59),
        key: "",
        count: 24,
        clear: true,
      })
    );
    mocks.gmXhr
      .mockImplementationOnce(({ onload }) =>
        onload({ responseText: '<div id="eventpane">It is the dawn of a new day!</div>' })
      )
      .mockImplementationOnce(({ onload }) =>
        onload({
          responseText:
            '<div id="eventpane"><a href="?s=Battle&amp;ss=ba&amp;encounter=recovered=">RE</a></div>',
        })
      );
    await runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK });
    vi.setSystemTime(new Date("2026-06-27T00:30:11.000Z"));
    const recovered = await runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK });

    expect(recovered).toMatchObject({
      status: "claimed",
      action: "navigated",
      href: "?s=Battle&ss=ba&encounter=recovered=",
    });
    expect(mocks.gmXhr).toHaveBeenCalledTimes(2);
    expect(mocks.runNavigationAutomation).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem("HVAA:lastEncounterGenerationIncident")).toBeNull();
  });
});
