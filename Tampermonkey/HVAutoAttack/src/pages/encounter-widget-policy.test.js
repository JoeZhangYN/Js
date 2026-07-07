import { beforeEach, describe, expect, it, vi } from "vitest";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

describe("planEncounterWidgetEvent", () => {
  it("routes reset-day events through the widget policy entry", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetResetDay",
        state: { date: 1000, key: "abc=", count: 3, clear: false },
      })
    ).toMatchObject({
      state: { date: 0, key: "", count: 0, clear: true },
      status: "ready",
      count: 0,
      warn: false,
    });
  });

  it("ignores invalid widget policy events", () => {
    expect(planEncounterWidgetEvent({ type: "unknown" })).toBeUndefined();
    expect(planEncounterWidgetEvent(null)).toBeUndefined();
  });

  it("classifies missing news encounter key without claiming equipment capacity failure", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetNewsLoaded",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        eventpane: "<p>No random encounter is currently available.</p>",
        engage: true,
        pageType: "hv",
      })
    ).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
    });
  });

  it("does not classify low equipment capacity text as encounter equipment-full failure", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetNewsLoaded",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        eventpane: "<table><tr><td>Inventory Capacity:</td><td>54</td><td>/</td><td>500</td></tr></table>",
        engage: true,
        pageType: "hv",
      })
    ).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
    });
  });

  it("does not classify untyped equipment full text outside the news error box", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetNewsLoaded",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        eventpane: "<div>Inventory Capacity: 54 / 500. Your equipment inventory is full?</div>",
        engage: true,
        pageType: "hv",
      })
    ).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
    });
  });

  it("classifies explicit equipment inventory full news as the only equipment prompt reason", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetNewsLoaded",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        eventpane: '<p class="messagebox_error">Your equipment inventory is full</p>',
        engage: true,
        pageType: "hv",
      })
    ).toMatchObject({
      action: "unavailable",
      unavailableReason: "equipmentInventoryFull",
    });
  });

  it("handles plain battle-page countdown clicks without requesting a news load", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetClicked",
        state: { date: Date.now(), key: "", count: 1, clear: true },
        pageType: "ba",
      })
    ).toMatchObject({
      action: "none",
      handled: true,
      status: "countdown",
    });
  });

  it("preserves the ready-window generation URL for main-world widget loads", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetTimerElapsed",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        pageType: "hv",
      })
    ).toMatchObject({
      action: "load",
      engage: true,
      href: "https://e-hentai.org/news.php?encounter",
    });
  });

  it("starts a fresh cooldown from battle-start evidence after a stale over-limit counter", () => {
    const outcome = planEncounterWidgetEvent({
      type: "widgetStartedEncounter",
      state: { date: Date.now() - 10 * 60 * 1000, key: "abc", count: 40, clear: false },
      search: "?s=Battle&ss=ba&encounter=abc",
    });

    expect(outcome).toMatchObject({
      status: "countdown",
      reason: "cooldown",
      count: 1,
      state: { date: Date.now(), key: "abc", count: 1, clear: true },
    });
    expect(outcome.remainingMs).toBeGreaterThan(0);
  });
});
