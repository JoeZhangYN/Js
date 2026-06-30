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

  it("ignores unknown widget policy events", () => {
    expect(planEncounterWidgetEvent({ type: "unknown" })).toBeUndefined();
  });
});
