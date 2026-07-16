import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";
import { BattleSessionEvent, runBattleSessionAutomation } from "../battle/battle-session.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
  runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.CLEAR });
});

describe("random encounter session lifecycle", () => {
  it("replaces stale round identity, exposes active zero count, and settles once", () => {
    localStorage.setItem("hvAA_roundType", "ar");
    const started = runBattleSessionAutomation({
      type: BattleSessionEvent.START_OR_RESUME,
      initializingText: "Initializing random encounter",
    });

    expect(
      runEncounterAutomation({
        type: EncounterEvent.BATTLE_SESSION_STARTED,
        session: started.snapshot,
      })
    ).toMatchObject({ ok: true, state: { count: 0 } });
    expect(runEncounterAutomation({ type: EncounterEvent.WIDGET_TICK })).toMatchObject({
      count: 0,
      entryPhase: "battleActive",
      status: "active",
    });

    const terminal = runBattleSessionAutomation({
      type: BattleSessionEvent.MARK_TERMINAL,
      outcome: "victory",
    });
    const completed = runEncounterAutomation({
      type: EncounterEvent.BATTLE_SESSION_TERMINAL,
      session: terminal.snapshot,
    });
    const duplicate = runEncounterAutomation({
      type: EncounterEvent.BATTLE_SESSION_TERMINAL,
      session: terminal.snapshot,
    });

    expect(completed).toMatchObject({ status: "completed", counted: true, state: { count: 1 } });
    expect(duplicate).toMatchObject({
      status: "alreadyCompleted",
      counted: false,
      state: { count: 1 },
    });
  });
});
