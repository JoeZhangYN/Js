import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const activeSession = (roundType = "ba") => ({
  version: 1,
  sessionId: "session-1",
  phase: "active",
  identity: { roundType, source: "initializationLog" },
  progress: { roundNow: 1, roundAll: 1, roundLeft: 0 },
});

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

describe("runEncounterAutomation battle session start", () => {
  it("records the authoritative random-encounter session as active", () => {
    const result = runEncounterAutomation({
      type: EncounterEvent.BATTLE_SESSION_STARTED,
      session: activeSession(),
    });

    expect(result).toMatchObject({
      claimed: false,
      recognized: true,
      ok: true,
      state: {
        count: 0,
        entry: { phase: "battleActive", sessionId: "session-1" },
      },
    });
  });

  it("rejects page hints and non-encounter session identities", () => {
    expect(
      runEncounterAutomation({
        type: EncounterEvent.BATTLE_SESSION_STARTED,
        session: activeSession("ar"),
      })
    ).toEqual({ claimed: false, recognized: false, status: "notEncounterBattle" });
  });
});
