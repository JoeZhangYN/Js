import { describe, expect, it, vi } from "vitest";
import {
  BattleCompletionEvent,
  BattleCompletionOutcome,
  runBattleCompletionAutomation,
} from "./battle-completion.js";

function deps(context = { monsterAlive: 0, roundNow: 1, roundAll: 1 }) {
  return {
    readCompletionContext: vi.fn(() => context),
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
    expect(d.triggerAlarm).toHaveBeenCalledWith("Defeat");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });

  it("returns next round without terminal side effects", () => {
    const d = deps({ monsterAlive: 0, roundNow: 1, roundAll: 2 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.NEXT_ROUND });
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    expect(d.clearSession).not.toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });

  it("handles victory completion through the entry", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.VICTORY });
    expect(d.triggerAlarm).toHaveBeenCalledWith("Victory");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).toHaveBeenCalledWith(3);
  });

  it("reads completion runtime fields once before classifying the outcome", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.VICTORY });

    expect(d.readCompletionContext).toHaveBeenCalledTimes(1);
  });
});
