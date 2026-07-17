import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const HVUT_RE_KEY = ["hvut", "re"].join("_");

function currentState(fields = {}) {
  const date = Date.now();
  return {
    date,
    cycleReadyAt: date + 1_805_000,
    anchorReason: "encounterCompleted",
    entry: { phase: "idle", key: "", sessionId: null },
    lastSettledSessionId: null,
    schemaVersion: 5,
    count: 5,
    utcDay: "2026-06-27",
    dayPhase: "active",
    invalidCycleCount: 0,
    generationRouteRevision: 1,
    ...fields,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

describe("encounter widget state authority", () => {
  it("ignores caller-injected widget state and projects the authoritative snapshot", () => {
    const stored = currentState();
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify(stored));

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TICK,
      state: currentState({ count: 99 }),
    });

    expect(outcome).toMatchObject({ count: 5, state: stored });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toEqual(stored);
  });

  it("persists a widget link observation before projecting the available key", () => {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify(currentState()));

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_LINK_FOUND,
      key: "ready123=",
      pageType: "hv",
      state: currentState({ count: 99 }),
    });

    expect(outcome).toMatchObject({
      count: 5,
      warn: true,
      state: { entry: { phase: "keyAvailable", key: "ready123=", sessionId: null } },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject(outcome.state);
  });

  it("physically writes one changed observation and keeps repeated widget ticks write-free", () => {
    let stored = currentState();
    const gmSetValue = vi.fn((_key, value) => {
      stored = value;
    });
    vi.stubGlobal(
      "GM_getValue",
      vi.fn(() => stored)
    );
    vi.stubGlobal("GM_setValue", gmSetValue);

    runEncounterAutomation({
      type: EncounterEvent.WIDGET_LINK_FOUND,
      key: "ready123=",
      pageType: "hv",
    });
    expect(gmSetValue).toHaveBeenCalledOnce();

    for (let index = 0; index < 5; index += 1) {
      expect(runEncounterAutomation({ type: EncounterEvent.WIDGET_TICK })).toMatchObject({
        state: { entry: { key: "ready123=" } },
      });
    }
    expect(gmSetValue).toHaveBeenCalledOnce();
  });
});
