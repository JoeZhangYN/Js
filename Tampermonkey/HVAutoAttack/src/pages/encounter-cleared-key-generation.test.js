import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENCOUNTER_COOLDOWN_MS } from "./encounter-day-state.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runNavigationAutomation: vi.fn(() => true),
}));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ OPEN_URL: "openUrl" }),
  NavigationRedirectReason: Object.freeze({ ENCOUNTER_ENTRY: "encounterEntry" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

const encounterHtml = (key) =>
  `<div id="eventpane"><a href="?s=Battle&amp;ss=ba&amp;encounter=${key}">RE</a></div>`;

beforeEach(() => {
  localStorage.clear();
  for (const mock of Object.values(mocks)) mock.mockClear();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T01:00:00.000Z"));
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

function storeAttemptedKey() {
  localStorage.setItem(
    "hvut_re",
    JSON.stringify({
      date: Date.now() - 31 * 60 * 1000,
      key: "old=",
      count: 1,
      clear: true,
    })
  );
}

describe("cleared encounter key generation", () => {
  it("generates and enters a different key after the old key cooldown", async () => {
    storeAttemptedKey();
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ responseText: encounterHtml("new=") }));

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });

    expect(outcome).toMatchObject({
      status: "claimed",
      action: "navigated",
      state: { key: "new=" },
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openUrl",
      reason: "encounterEntry",
      url: "?s=Battle&ss=ba&encounter=new=",
    });
  });

  it("waits a full probe cycle when generation returns the same already attempted key", async () => {
    storeAttemptedKey();
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ responseText: encounterHtml("old=") }));

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });

    expect(outcome).toMatchObject({
      status: "waiting",
      reason: "probeCycle",
      generation: {
        status: "unavailable",
        reason: "encounterKeyAlreadyAttempted",
        recovery: { reason: "probeCycle", countdownMs: ENCOUNTER_COOLDOWN_MS },
      },
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });
});
