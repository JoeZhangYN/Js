import { describe, expect, it, vi } from "vitest";
import { BattleCompletionEvent, runBattleCompletionAutomation } from "./battle-completion.js";

function deps(context = { monsterAlive: 0, roundNow: 1, roundAll: 1 }) {
  const snapshot = {
    version: 1,
    sessionId: "session-1",
    phase: "terminal",
    identity: { roundType: context.roundType || "ar", source: "initializationLog" },
    progress: { roundNow: context.roundNow, roundAll: context.roundAll, roundLeft: 0 },
    outcome: context.monsterAlive > 0 ? "defeat" : "victory",
  };
  return {
    readCompletionContext: vi.fn(() => context),
    recordCompletion: vi.fn(),
    markSessionTerminal: vi.fn(() => ({ ok: true, snapshot })),
    completeEncounter: vi.fn(() => ({
      status: "notEncounterBattle",
      ok: true,
      counted: false,
    })),
    completeUtilityLearning: vi.fn(),
    triggerAlarm: vi.fn(),
    clearSession: vi.fn(),
    isCompletionReached: vi.fn(() => true),
    recordCompletionEvidence: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

describe("runBattleCompletionAutomation", () => {
  it("handles defeat completion through the entry", () => {
    const d = deps({ monsterAlive: 1, roundNow: 1, roundAll: 1 });
    d.recordCompletion.mockReturnValue({ kind: "recorded" });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: "defeat" });
    expect(d.recordCompletion).toHaveBeenCalledTimes(1);
    expect(d.triggerAlarm).toHaveBeenCalledWith("Defeat");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
    expect(d.recordCompletionEvidence).toHaveBeenCalledWith({
      outcome: "defeat",
      context: { monsterAlive: 1, roundNow: 1, roundAll: 1 },
      effects: {
        recordCompletion: true,
        recordCompletionResult: { kind: "recorded" },
        terminalSession: expect.objectContaining({ ok: true }),
        terminalSessionOk: true,
        encounterCompletion: {
          status: "notEncounterBattle",
          ok: true,
          counted: false,
        },
        encounterCompletionOk: true,
        utilityLearning: true,
        alarm: true,
        clearSession: true,
      },
    });
  });

  it("returns next round without terminal side effects", () => {
    const d = deps({ monsterAlive: 0, roundNow: 1, roundAll: 2 });
    d.recordCompletion.mockReturnValue({ kind: "recorded" });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: "nextRound" });
    expect(d.recordCompletion).toHaveBeenCalledTimes(1);
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    expect(d.clearSession).not.toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
    expect(d.recordCompletionEvidence).toHaveBeenCalledWith({
      outcome: "nextRound",
      context: { monsterAlive: 0, roundNow: 1, roundAll: 2 },
      effects: { recordCompletion: true, recordCompletionResult: { kind: "recorded" } },
    });
  });

  it("handles victory completion through the entry", () => {
    const context = { monsterAlive: 0, roundNow: 2, roundAll: 2 };
    const d = deps(context);
    d.recordCompletion.mockReturnValue({ kind: "recorded" });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: "victory" });
    expect(d.recordCompletion).toHaveBeenCalledTimes(1);
    expect(d.triggerAlarm).toHaveBeenCalledWith("Victory");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).toHaveBeenCalledWith(3, {
      source: "battleCompletion",
      outcome: "victory",
      context,
    });
    expect(d.recordCompletionEvidence).toHaveBeenCalledWith({
      outcome: "victory",
      context,
      effects: {
        recordCompletion: true,
        recordCompletionResult: { kind: "recorded" },
        terminalSession: expect.objectContaining({ ok: true }),
        terminalSessionOk: true,
        encounterCompletion: {
          status: "notEncounterBattle",
          ok: true,
          counted: false,
        },
        encounterCompletionOk: true,
        utilityLearning: true,
        alarm: true,
        clearSession: true,
        scheduleReload: true,
      },
    });
  });

  it("clears terminal battle sessions through one completion side-effect path", () => {
    const defeat = deps({ monsterAlive: 1, roundNow: 1, roundAll: 1 });
    const victory = deps({ monsterAlive: 0, roundNow: 1, roundAll: 1 });

    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, defeat);
    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, victory);

    expect(defeat.clearSession).toHaveBeenCalledTimes(1);
    expect(victory.clearSession).toHaveBeenCalledTimes(1);
    expect(defeat.scheduleReload).not.toHaveBeenCalled();
    expect(victory.scheduleReload).toHaveBeenCalledWith(3, {
      source: "battleCompletion",
      outcome: "victory",
      context: { monsterAlive: 0, roundNow: 1, roundAll: 1 },
    });
  });
});
