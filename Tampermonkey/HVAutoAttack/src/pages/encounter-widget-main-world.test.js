import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyEncounterGenerationResult } from "./encounter-generation-result.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import {
  planEncounterWidgetEvent,
  planEncounterWidgetGeneration,
} from "./encounter-widget-policy.js";

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
      checkMode: "manual",
      href: "https://e-hentai.org/news.php",
    });
  });

  it("suppresses isekai root encounter clicks and exposes no timer-expiry entry", () => {
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
    ).toBeUndefined();
  });

  it("does not count or start cooldown when news only exposes an encounter key", () => {
    const result = classifyEncounterGenerationResult({
      eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=abc=">RE</a>',
    });
    const generation = runEncounterPolicy({
      type: EncounterPolicyEvent.APPLY_GENERATION_RESULT,
      state: { date: 0, key: "", count: 0, clear: true },
      result,
      checkMode: "manual",
    });
    expect(
      planEncounterWidgetGeneration({
        state: generation.state,
        application: generation.application,
        result: generation.result,
        pageType: "hv",
      })
    ).toMatchObject({
      action: "navigate",
      href: "?s=Battle&ss=ba&encounter=abc=",
      status: "ready",
      count: 0,
      state: {
        date: 0,
        count: 0,
        entry: { phase: "keyAvailable", key: "abc=", sessionId: null },
      },
    });
  });

  it("does not expose the retired widget-start recognition path", () => {
    const state = { date: 0, key: "", count: 0, clear: true };

    const outcome = planEncounterWidgetEvent({
      type: "widgetStartedEncounter",
      state,
      search: "?s=Battle&ss=ba&encounter=abc=",
      pageType: "hv",
    });

    expect(outcome).toBeUndefined();
  });
});
