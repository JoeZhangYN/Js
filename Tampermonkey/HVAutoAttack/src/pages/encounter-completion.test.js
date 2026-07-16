import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const terminalSession = (sessionId, outcome = "victory", roundType = "ba") => ({
  version: 1,
  sessionId,
  phase: "terminal",
  identity: { roundType, source: "initializationLog" },
  progress: { roundNow: 1, roundAll: 1, roundLeft: 0 },
  outcome,
});

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

describe("runEncounterAutomation encounter completion", () => {
  it("counts each terminal random-encounter session exactly once", () => {
    const first = runEncounterAutomation({
      type: EncounterEvent.BATTLE_SESSION_TERMINAL,
      session: terminalSession("session-1"),
    });
    const duplicate = runEncounterAutomation({
      type: EncounterEvent.BATTLE_SESSION_TERMINAL,
      session: terminalSession("session-1"),
    });
    vi.setSystemTime(new Date("2026-06-27T12:31:00.000Z"));
    const second = runEncounterAutomation({
      type: EncounterEvent.BATTLE_SESSION_TERMINAL,
      session: terminalSession("session-2", "defeat"),
    });

    expect(first).toMatchObject({ status: "completed", counted: true, state: { count: 1 } });
    expect(duplicate).toMatchObject({
      status: "alreadyCompleted",
      counted: false,
      state: { count: 1 },
    });
    expect(second).toMatchObject({
      status: "completed",
      counted: true,
      state: { count: 2, lastSettledSessionId: "session-2" },
    });
  });

  it("requires terminal session identity instead of loose round fields", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.BATTLE_SESSION_TERMINAL,
        session: terminalSession("arena", "victory", "ar"),
      })
    ).toEqual({ claimed: false, ok: true, counted: false, status: "notEncounterBattle" });
    expect(
      runEncounterAutomation({
        type: EncounterEvent.BATTLE_SESSION_TERMINAL,
        session: { ...terminalSession("active"), phase: "active" },
      })
    ).toEqual({ claimed: false, ok: true, counted: false, status: "notTerminal" });
  });

  it("returns a typed persistence failure", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("GM_getValue", (_key, fallback) => fallback);
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("GM write blocked");
    });

    expect(
      runEncounterAutomation({
        type: EncounterEvent.BATTLE_SESSION_TERMINAL,
        session: terminalSession("session-failure", "defeat"),
      })
    ).toMatchObject({ status: "persistenceFailed", ok: false, counted: false });
    expect(warn).toHaveBeenCalled();
  });
});
