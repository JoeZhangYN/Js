import { beforeEach, describe, expect, it, vi } from "vitest";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

describe("main-world encounter widget timing", () => {
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

  it("ignores root-page started checks even when a stale encounter key is present", () => {
    const state = { date: 0, key: "", count: 0, clear: true };

    const outcome = planEncounterWidgetEvent({
      type: "widgetStartedEncounter",
      state,
      search: "?s=Battle&ss=ba&encounter=abc=",
      pageType: "hv",
    });

    expect(outcome).toMatchObject({ state, count: 0, status: "ready" });
  });
});
