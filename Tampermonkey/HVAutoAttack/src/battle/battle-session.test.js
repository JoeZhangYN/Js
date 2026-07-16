import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";
import { BattleSessionEvent, runBattleSessionAutomation } from "./battle-session.js";

beforeEach(() => {
  sessionStorage.clear();
  runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.CLEAR });
  vi.restoreAllMocks();
});

describe("runBattleSessionAutomation", () => {
  it("lets current initialization evidence replace a retired arena identity", () => {
    localStorage.setItem("hvAA_roundType", "ar");

    const result = runBattleSessionAutomation({
      type: BattleSessionEvent.START_OR_RESUME,
      initializingText: "Initializing random encounter",
    });

    expect(result).toMatchObject({
      ok: true,
      mode: "started",
      initialized: true,
      snapshot: {
        phase: "active",
        identity: { roundType: "ba", source: "initializationLog" },
        progress: { roundNow: 1, roundAll: 1 },
      },
    });
    expect(result.snapshot.sessionId).toEqual(expect.any(String));
  });

  it("resumes only the active session checkpoint without replaying a new identity", () => {
    const started = runBattleSessionAutomation({
      type: BattleSessionEvent.START_OR_RESUME,
      initializingText: "Initializing random encounter",
    });

    expect(
      runBattleSessionAutomation({
        type: BattleSessionEvent.START_OR_RESUME,
        initializingText: "Round begins",
      })
    ).toMatchObject({
      ok: true,
      mode: "resumed",
      initialized: false,
      snapshot: { sessionId: started.snapshot.sessionId, identity: { roundType: "ba" } },
    });
  });

  it("fails closed when neither initialization evidence nor a checkpoint exists", () => {
    expect(
      runBattleSessionAutomation({
        type: BattleSessionEvent.START_OR_RESUME,
        initializingText: "Round begins",
      })
    ).toEqual({
      ok: false,
      mode: "unknown",
      initialized: false,
      reason: "absent",
    });
  });

  it("records progress and terminal identity in the same session snapshot", () => {
    const started = runBattleSessionAutomation({
      type: BattleSessionEvent.START_OR_RESUME,
      initializingText: "Initializing arena challenge #10 (Round 2 / 5)",
    });
    expect(
      runBattleSessionAutomation({
        type: BattleSessionEvent.RECORD_START_PROGRESS,
        initializingText: "Initializing arena challenge #10 (Round 2 / 5)",
      })
    ).toEqual({ roundNow: 2, roundAll: 5, roundLeft: 3 });

    const terminal = runBattleSessionAutomation({
      type: BattleSessionEvent.MARK_TERMINAL,
      outcome: "victory",
    });

    expect(terminal).toMatchObject({
      ok: true,
      snapshot: {
        sessionId: started.snapshot.sessionId,
        phase: "terminal",
        outcome: "victory",
        progress: { roundNow: 2, roundAll: 5 },
      },
    });
    expect(
      runBattleSessionAutomation({
        type: BattleSessionEvent.START_OR_RESUME,
        initializingText: "Round begins",
      })
    ).toMatchObject({ ok: false, reason: "terminalSession" });
  });
});
