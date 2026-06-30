import { describe, expect, it, vi } from "vitest";
import {
  BattleCompletionEvent,
  BattleCompletionOutcome,
  runBattleCompletionAutomation,
} from "./battle-completion.js";

function deps(context = { monsterAlive: 0, roundNow: 1, roundAll: 1 }) {
  return {
    readCompletionContext: vi.fn(() => context),
    recordCompletion: vi.fn(),
    triggerAlarm: vi.fn(),
    clearSession: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

describe("runBattleCompletionAutomation", () => {
  it("handles defeat completion through the entry", () => {
    const d = deps({ monsterAlive: 1, roundNow: 1, roundAll: 1 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.DEFEAT });
    expect(d.recordCompletion).toHaveBeenCalledTimes(1);
    expect(d.triggerAlarm).toHaveBeenCalledWith("Defeat");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });

  it("returns next round without terminal side effects", () => {
    const d = deps({ monsterAlive: 0, roundNow: 1, roundAll: 2 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.NEXT_ROUND });
    expect(d.recordCompletion).toHaveBeenCalledTimes(1);
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    expect(d.clearSession).not.toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });

  it("handles victory completion through the entry", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.VICTORY });
    expect(d.recordCompletion).toHaveBeenCalledTimes(1);
    expect(d.triggerAlarm).toHaveBeenCalledWith("Victory");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).toHaveBeenCalledWith(3);
  });

  it("clears terminal battle sessions through one completion side-effect path", () => {
    const defeat = deps({ monsterAlive: 1, roundNow: 1, roundAll: 1 });
    const victory = deps({ monsterAlive: 0, roundNow: 1, roundAll: 1 });

    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, defeat);
    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, victory);

    expect(defeat.clearSession).toHaveBeenCalledTimes(1);
    expect(victory.clearSession).toHaveBeenCalledTimes(1);
    expect(defeat.scheduleReload).not.toHaveBeenCalled();
    expect(victory.scheduleReload).toHaveBeenCalledWith(3);
  });

  it("reads completion runtime fields once before classifying the outcome", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.VICTORY });

    expect(d.readCompletionContext).toHaveBeenCalledTimes(1);
  });

  it("records completion before reading the completion ruling context", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });

    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d);

    expect(d.recordCompletion.mock.invocationCallOrder[0]).toBeLessThan(
      d.readCompletionContext.mock.invocationCallOrder[0]
    );
  });

  it("rejects unknown battle completion events without side effects", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });

    expect(runBattleCompletionAutomation({ type: "unknown" }, d)).toEqual({
      outcome: BattleCompletionOutcome.ONGOING,
    });

    expect(d.recordCompletion).not.toHaveBeenCalled();
    expect(d.readCompletionContext).not.toHaveBeenCalled();
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    expect(d.clearSession).not.toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });
});
