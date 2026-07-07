import { beforeEach, describe, expect, it, vi } from "vitest";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

describe("main-world encounter widget timing", () => {
  it("keeps the ready window after a main-world generation load returns no encounter key", () => {
    const attemptKey = `${Date.now() - 31 * 60 * 1000}::true:ready`;
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 7, clear: true },
      eventpane: "<p>No random encounter is currently available.</p>",
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      status: "ready",
      reason: "readyWindow",
      remainingMs: 0,
      state: {
        date: Date.now() - 31 * 60 * 1000,
        key: "",
        count: 7,
        clear: true,
        generationAttemptKey: attemptKey,
      },
    });
  });

  it("suppresses repeated main-world news generation inside the same ready window", () => {
    const date = Date.now() - 31 * 60 * 1000;
    const attemptKey = `${date}::true:ready`;

    expect(
      planEncounterWidgetEvent({
        type: "widgetTimerElapsed",
        state: { date, key: "", count: 7, clear: true, generationAttemptKey: attemptKey },
        pageType: "hv",
      })
    ).toMatchObject({
      action: "none",
      handled: true,
      recovery: "generationAttemptSuppressed",
      status: "ready",
      state: { generationAttemptKey: attemptKey },
    });
  });

  it("keeps manual ready-window clicks able to load the encounter check", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetClicked",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        pageType: "hv",
      })
    ).toMatchObject({
      action: "load",
      engage: true,
      href: "https://e-hentai.org/news.php?encounter",
    });
  });

  it("suppresses isekai root encounter clicks and timer expiry without loading news", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true };

    expect(
      planEncounterWidgetEvent({
        type: "widgetClicked",
        state,
        pageType: "is",
      })
    ).toMatchObject({
      action: "none",
      handled: true,
      recovery: "isekaiNavigationSuppressed",
    });
    expect(
      planEncounterWidgetEvent({
        type: "widgetTimerElapsed",
        state,
        pageType: "is",
      })
    ).toMatchObject({
      action: "none",
      handled: true,
      recovery: "isekaiNavigationSuppressed",
    });
  });

  it("does not count or start cooldown when news only exposes an encounter key", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetNewsLoaded",
        state: { date: 0, key: "", count: 0, clear: true },
        eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=abc=">RE</a>',
        engage: false,
        pageType: "hv",
      })
    ).toMatchObject({
      action: "ready",
      status: "ready",
      count: 0,
      state: { date: 0, key: "abc=", count: 0, clear: false },
    });
  });

  it("ignores root-page started checks without an encounter key", () => {
    const state = { date: 0, key: "", count: 0, clear: true };

    const outcome = planEncounterWidgetEvent({
      type: "widgetStartedEncounter",
      state,
      search: "",
    });

    expect(outcome).toMatchObject({ state, count: 0, status: "ready" });
  });
});
