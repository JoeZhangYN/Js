import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterGenerationApplication } from "./encounter-generation-application.js";
import { classifyEncounterGenerationResult } from "./encounter-generation-result.js";
import {
  planEncounterWidgetEvent,
  planEncounterWidgetGeneration,
} from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

describe("planEncounterWidgetEvent", () => {
  it("keeps state-changing widget events outside the pure projection entry", () => {
    expect(planEncounterWidgetEvent({ type: "widgetResetDay" })).toBeUndefined();
    expect(planEncounterWidgetEvent({ type: "widgetLinkFound" })).toBeUndefined();
    expect(planEncounterWidgetEvent({ type: "widgetNewsLoaded" })).toBeUndefined();
  });

  it("ignores invalid widget policy events", () => {
    expect(planEncounterWidgetEvent({ type: "unknown" })).toBeUndefined();
    expect(planEncounterWidgetEvent(null)).toBeUndefined();
  });

  it("classifies missing news encounter key without claiming equipment capacity failure", () => {
    const result = classifyEncounterGenerationResult({
      eventpane: "<p>No random encounter is currently available.</p>",
    });
    expect(result).toMatchObject({ reason: "encounterKeyMissing" });
    expect(
      planEncounterWidgetGeneration({
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        application: EncounterGenerationApplication.MANUAL_EMPTY,
        result,
        pageType: "hv",
      })
    ).toMatchObject({ action: "unavailable", unavailableReason: "encounterKeyMissing" });
  });

  it("does not classify low equipment capacity text as encounter equipment-full failure", () => {
    expect(
      classifyEncounterGenerationResult({
        eventpane:
          "<table><tr><td>Inventory Capacity:</td><td>54</td><td>/</td><td>500</td></tr></table>",
      })
    ).toMatchObject({ reason: "encounterKeyMissing" });
  });

  it("does not classify untyped equipment full text outside the news error box", () => {
    expect(
      classifyEncounterGenerationResult({
        eventpane: "<div>Inventory Capacity: 54 / 500. Your equipment inventory is full?</div>",
      })
    ).toMatchObject({ reason: "encounterKeyMissing" });
  });

  it("classifies explicit equipment inventory full news as the only equipment prompt reason", () => {
    expect(
      classifyEncounterGenerationResult({
        eventpane: '<p class="messagebox_error">Your equipment inventory is full</p>',
      })
    ).toMatchObject({ reason: "equipmentInventoryFull" });
  });

  it("lets a plain battle-page countdown click recheck immediately", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetClicked",
        state: { date: Date.now(), key: "", count: 1, clear: true },
        pageType: "ba",
      })
    ).toMatchObject({
      action: "load",
      checkMode: "manual",
      status: "countdown",
    });
  });

  it("does not expose timer expiry as an automatic widget entry", () => {
    expect(
      planEncounterWidgetEvent({
        type: "widgetTimerElapsed",
        state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true },
        pageType: "hv",
      })
    ).toBeUndefined();
  });

  it("does not expose widget-owned battle recognition", () => {
    const date = Date.now() - 10 * 60 * 1000;
    const outcome = planEncounterWidgetEvent({
      type: "widgetStartedEncounter",
      state: { date, key: "abc", count: 40, clear: false },
      search: "?s=Battle&ss=ba&encounter=abc",
      pageType: "ba",
    });

    expect(outcome).toBeUndefined();
  });
});
